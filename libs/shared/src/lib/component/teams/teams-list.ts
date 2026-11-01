import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PlayerStore, SeasonStore, TeamService } from '@f2020/api';
import { IDriver, IRace, ITeam } from '@f2020/data';
import { AddDriverComponent, DriverPipe } from '@f2020/driver';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { filter, first, map, switchMap } from 'rxjs';
import { CardPageComponent, LoadingComponent } from '..';
import { TeamLogoComponent } from '../team-logo/team-logo';
import { DriverHeadshotComponent } from '../driver-headshot/driver-headshot';
import { icon } from '../../font-awesome';
import { TeamDriverAction, TeamDriverDialog, TeamDriverDialogData } from './team-driver-dialog';

@Component({
  selector: 'sha-teams-list',
  templateUrl: './teams-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbarModule,
    CardPageComponent,
    MatListModule,
    MatDialogModule,
    MatButtonModule,
    FaIconComponent,
    MatDividerModule,
    LoadingComponent,
    DriverPipe,
    DriverHeadshotComponent,
    TeamLogoComponent,
  ],
  styles: `
    /* Only an admin can open a driver. For the others the drivers are disabled, but read as normal */
    mat-action-list {
      --mat-list-list-item-disabled-label-text-opacity: 1;
      --mat-list-list-item-disabled-leading-icon-opacity: 1;
      --mat-list-list-item-disabled-trailing-icon-opacity: 1;
      --mat-list-list-item-disabled-state-layer-opacity: 0;
    }
  `,
})
export class TeamsList {
  readonly #dialog = inject(MatDialog);
  readonly #service = inject(TeamService);
  readonly #snackBar = inject(MatSnackBar);
  readonly #season = inject(SeasonStore).season;
  readonly #player = inject(PlayerStore).player;
  race = input<IRace | undefined>(undefined);
  header = computed(() => (this.race() ? `Hold - ${this.race().name}` : 'Hold'));
  teams = input.required<ITeam[]>();
  drivers = input.required<IDriver[]>();
  protected icon = icon;
  protected readonly seasonId = computed(() => this.#season()?.id);
  protected readonly admin = computed(() => !!this.#player()?.roles?.includes('admin'));

  /** An admin adds a driver by clicking the team, when there are drivers to add */
  protected readonly canAdd = computed(() => this.admin() && !!this.drivers()?.length);

  /** The teams with the most points first, with a trophy for each win */
  protected readonly sorted = computed(() =>
    this.teams()
      .map(team => {
        const standing = this.#service.standings()?.[team.constructorId];
        return { team, points: standing?.points ?? 0, wins: Array(standing?.wins ?? 0) };
      })
      .sort((a, b) => b.points - a.points),
  );

  protected addDriver(team: ITeam) {
    this.#dialog
      .open(AddDriverComponent, { data: this.drivers() })
      .afterClosed()
      .pipe(
        map(
          driver =>
            ({
              ...team,
              drivers: [...new Set([...team.drivers, driver])],
            }) as ITeam,
        ),
        switchMap(team => this.#service.updateTeam(team).then(() => team.drivers[team.drivers.length - 1])),
        first(),
      )
      .subscribe(driver => this.#snackBar.open(`${this.#getDriverName(driver)} tilføjet til ${team.name}`, undefined, { duration: 1000 }));
  }

  protected editDriver(driver: IDriver | undefined, driverId: string, team: ITeam) {
    const data: TeamDriverDialogData = { driver, team, previous: !!team.previousDrivers?.includes(driverId) };
    this.#dialog
      .open<TeamDriverDialog, TeamDriverDialogData, TeamDriverAction>(TeamDriverDialog, { data })
      .afterClosed()
      .pipe(filter(action => !!action))
      .subscribe(action => (action === 'remove' ? this.#removeDriver(driverId, team) : this.#previousDriver(driverId, team)));
  }

  #removeDriver(driver: string, team: ITeam) {
    const payload: ITeam = {
      ...team,
      drivers: team.drivers.filter(existing => existing !== driver),
    };
    this.#service.updateTeam(payload).then(() => this.#snackBar.open(`${this.#getDriverName(driver)} fjernet fra ${team.name}`, undefined, { duration: 1000 }));
  }

  #previousDriver(driver: string, team: ITeam) {
    const alreadyPrevious = team.previousDrivers.includes(driver);
    const payload: ITeam = {
      ...team,
      drivers: alreadyPrevious ? team.drivers.concat(driver) : team.drivers.filter(existing => existing !== driver),
      previousDrivers: alreadyPrevious ? team.previousDrivers.filter(p => p !== driver) : [...new Set([...(team.previousDrivers ?? []), driver])],
    };
    this.#service
      .updateTeam(payload)
      .then(() => this.#snackBar.open(`${this.#getDriverName(driver)} er nu ${alreadyPrevious ? 'igen' : 'forhenværende'} kører for ${team.name}`, undefined, { duration: 1000 }));
  }

  protected allDrivers(team: ITeam) {
    return [...team.drivers, ...(team.previousDrivers ?? [])];
  }

  #getDriverName(driverId: string) {
    return this.drivers().find(d => d.driverId === driverId)?.name;
  }
}

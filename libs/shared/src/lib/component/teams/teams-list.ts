import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SeasonStore, TeamService } from '@f2020/api';
import { IDriver, IRace, ITeam } from '@f2020/data';
import { AddDriverComponent, DriverPipe } from '@f2020/driver';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { first, map, switchMap } from 'rxjs';
import { CardPageComponent, HasRoleDirective, LoadingComponent } from '..';
import { TeamLogoComponent } from '../team-logo/team-logo.component';
import { icon } from '../../font-awesome';

@Component({
  selector: 'sha-teams-list',
  templateUrl: './teams-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbarModule,
    CardPageComponent,
    MatListModule,
    HasRoleDirective,
    MatDialogModule,
    MatButtonModule,
    FaIconComponent,
    MatDividerModule,
    LoadingComponent,
    DriverPipe,
    NgOptimizedImage,
    TeamLogoComponent,
  ],
})
export class TeamsList {
  readonly #dialog = inject(MatDialog);
  readonly #service = inject(TeamService);
  readonly #snackBar = inject(MatSnackBar);
  readonly #season = inject(SeasonStore).season;
  race = input<IRace | undefined>(undefined);
  header = computed(() => (this.race() ? `Hold - ${this.race().name}` : 'Hold'));
  teams = input.required<ITeam[], ITeam[]>({
    transform: value => value.toSorted((a, b) => (b.points ?? 0) - (a.points ?? 0)),
  });
  drivers = input.required<IDriver[]>();
  protected icon = icon;
  protected readonly seasonId = computed(() => this.#season()?.id);

  protected noDrivers = computed(() => !this.drivers()?.length);

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
            } as ITeam)
        ),
        switchMap(team => this.#service.updateTeam(team).then(() => team.drivers[team.drivers.length - 1])),
        first()
      )
      .subscribe(driver => this.#snackBar.open(`${this.#getDriverName(driver)} tilføjet til ${team.name}`, undefined, { duration: 1000 }));
  }

  removeDriver(driver: string, team: ITeam) {
    const payload: ITeam = {
      ...team,
      drivers: team.drivers.filter(existing => existing !== driver),
    };
    this.#service.updateTeam(payload).then(() => this.#snackBar.open(`${this.#getDriverName(driver)} fjernet fra ${team.name}`, undefined, { duration: 1000 }));
  }

  previousDriver(driver: string, team: ITeam) {
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

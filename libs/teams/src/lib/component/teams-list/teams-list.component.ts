import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TeamService } from '@f2020/api';
import { ITeam } from '@f2020/data';
import { AddDriverComponent, DriverNamePipe, DriversStore } from '@f2020/driver';
import { CardPageComponent, HasRoleDirective, icon, LoadingComponent } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { first, map, switchMap } from 'rxjs';

@Component({
  selector: 'teams-teams-list',
  templateUrl: './teams-list.component.html',
  styleUrls: ['./teams-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatToolbarModule, CardPageComponent, NgIf, MatListModule, NgFor, HasRoleDirective, MatDialogModule, MatButtonModule, FontAwesomeModule, MatDividerModule, LoadingComponent, AsyncPipe, DriverNamePipe],
  providers: [DriversStore],
})
export class TeamsListComponent {

  teams$ = this.service.teams$;
  icon = icon;

  constructor(
    private dialog: MatDialog,
    private store: DriversStore,
    private service: TeamService,
    private snackBar: MatSnackBar,
  ) {
    store.loadDrivers();
  }

  addDriver(team: ITeam) {
    this.dialog.open(AddDriverComponent, { data: this.store.drivers() }).afterClosed().pipe(
      map(driver => ({
        ...team,
        drivers: [...team.drivers, driver],
      }) as ITeam),
      switchMap(team => this.service.updateTeam(team).pipe(map(() => team.drivers[team.drivers.length - 1]))),
      first(),
    ).subscribe(driver => this.snackBar.open(`${driver} tilføjet til ${team.name}`, undefined, { duration: 1000 }));
  }

  removeDriver(driver: string, team: ITeam) {
    const payload: ITeam = {
      ...team,
      drivers: team.drivers.filter(existing => existing !== driver),
    };
    this.service.updateTeam(payload).pipe(
      first(),
    ).subscribe(() => this.snackBar.open(`${driver} fjernet fra ${team.name}`, undefined, { duration: 1000 }));

  }
}

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeamService } from '@f2020/api';
import { ITeam } from '@f2020/data';
import { AddDriverComponent, DriversActions, DriversFacade } from '@f2020/driver';
import { icon } from '@f2020/shared';
import { first, map, mapTo, switchMap } from 'rxjs';
import { DriverNamePipe } from '../../../../../driver/src/lib/pipe/driver-name.pipe';
import { LoadingComponent } from '../../../../../shared/src/lib/component/loading/loading.component';
import { MatDividerModule } from '@angular/material/divider';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { HasRoleDirective } from '../../../../../shared/src/lib/component/has-role.directive';
import { MatListModule } from '@angular/material/list';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { CardPageComponent } from '../../../../../shared/src/lib/component/card-page/card-page.component';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
    selector: 'teams-teams-list',
    templateUrl: './teams-list.component.html',
    styleUrls: ['./teams-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatToolbarModule, CardPageComponent, NgIf, MatListModule, NgFor, HasRoleDirective, MatButtonModule, FontAwesomeModule, MatDividerModule, LoadingComponent, AsyncPipe, DriverNamePipe]
})
export class TeamsListComponent implements OnInit {

  teams$ = this.service.teams$;
  icon = icon;

  constructor(
    private dialog: MatDialog,
    private driverFacade: DriversFacade,
    private service: TeamService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.driverFacade.dispatch(DriversActions.loadDrivers());
  }

  addDriver(team: ITeam) {
    this.driverFacade.allDriver$.pipe(
      switchMap(drivers => this.dialog.open(AddDriverComponent, { data: drivers }).afterClosed()),
      map(driver => ({
        ...team,
        drivers: [...team.drivers, driver],
      }) as ITeam),
      switchMap(team => this.service.updateTeam(team).pipe(mapTo(team.drivers[team.drivers.length - 1]))),
      first(),
    ).subscribe(driver => this.snackBar.open(`${driver} tilføjet til ${team.name}`, undefined, { duration: 1000 }));
  }

  removeDriver(driver: string, team: ITeam) {
    const payload: ITeam = {
      ...team,
      drivers: team.drivers.filter(existing => existing !== driver)
    };
    this.service.updateTeam(payload).pipe(
      first(),
    ).subscribe(() => this.snackBar.open(`${driver} fjernet fra ${team.name}`, undefined, { duration: 1000 }));

  }
}

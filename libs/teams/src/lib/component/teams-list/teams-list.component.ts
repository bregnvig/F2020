import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { TeamService } from '@f2020/api';
import { ITeam } from '@f2020/data';
import { AddDriverComponent, DriversActions, DriversFacade } from '@f2020/driver';
import { first, map, mapTo, switchMap } from 'rxjs';

@Component({
  selector: 'teams-teams-list',
  templateUrl: './teams-list.component.html',
  styleUrls: ['./teams-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamsListComponent implements OnInit {

  teams$ = this.service.teams$;

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

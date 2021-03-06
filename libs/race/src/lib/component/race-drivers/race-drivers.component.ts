import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RacesActions, RacesFacade } from '@f2020/api';
import { IRace } from '@f2020/data';
import { DriversActions, DriversFacade } from '@f2020/driver';
import { AbstractSuperComponent } from '@f2020/shared';
import { truthy } from '@f2020/tools';
import { Observable } from 'rxjs';
import { filter, first, map, pairwise, switchMap } from 'rxjs/operators';
import { AddDriverComponent } from './add-driver/add-driver.component';

type Operation = 'removed' | 'added' | 'moved' | 'undo';

const message = (driverName: string, operation: Operation) => {
  switch (operation) {
    case 'added': return `${driverName} er blevet tilføjet`;
    case 'moved': return `${driverName} er blevet flyttet`;
    case 'removed': return `${driverName} er blevet fjernet`;
  }
};

@Component({
  templateUrl: './race-drivers.component.html',
  styleUrls: ['./race-drivers.component.scss']
})
export class RaceDriversComponent extends AbstractSuperComponent implements OnInit {

  drivers: string[];
  race$: Observable<IRace>;
  private driverId: string;
  private operation: Operation;
  private previousDrivers: string[];

  constructor(
    private facade: RacesFacade,
    private driverFacade: DriversFacade,
    private dialog: MatDialog,
    private snackBar: MatSnackBar) {
    super();
  }

  ngOnInit(): void {
    this.driverFacade.dispatch(DriversActions.loadDrivers());
    this.race$ = this.facade.selectedRace$.pipe(
      truthy(),
    );
    const updated$ = this.facade.updating$.pipe(
      pairwise(),
      filter(([previous, current]) => previous && !current),
    );
    const allDriver$ = this.driverFacade.allDriver$.pipe(truthy());
    this.race$.pipe(
      map(race => race.drivers || []),
      first(),
      this.takeUntilDestroyed(),
    ).subscribe(_drivers => this.drivers = [..._drivers]);
    updated$.pipe(
      switchMap(() => allDriver$.pipe(map(drivers => drivers.find(driver => driver.driverId === this.driverId)))),
      this.takeUntilDestroyed(),
    ).subscribe(driver => {
      if (this.operation !== 'undo') {
        this.snackBar.open(message(driver.name, this.operation), 'UNDO', { duration: 5000 }).onAction().pipe(
          first(),
        ).subscribe(() => {
          this.drivers = [...this.previousDrivers];
          this.updateDrivers('undo');
        });
      }
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    const driver = this.drivers[event.previousIndex];
    const previousDrivers = [...this.drivers];

    moveItemInArray(this.drivers, event.previousIndex, event.currentIndex);
    this.updateDrivers('moved', driver, previousDrivers);
  }

  removeDriver(index: number): void {
    const driver = this.drivers[index];
    const previousDrivers = [...this.drivers];
    this.drivers.splice(index, 1);
    this.updateDrivers('removed', driver, previousDrivers);
  }

  addDriver() {
    const previousDrivers = [...this.drivers];
    this.dialog.open(AddDriverComponent, { data: this.drivers }).afterClosed().pipe(
      first()
    ).subscribe(driver => {
      this.drivers.push(driver);
      this.updateDrivers('added', driver, previousDrivers);
    });
  }

  private updateDrivers(operation: Operation, driver?: string, previousDrivers?: string[]) {
    this.operation = operation;
    this.driverId = driver;
    this.previousDrivers = previousDrivers;
    this.facade.dispatch(RacesActions.updateRaceDrivers({ drivers: [...this.drivers] }));
  }

}

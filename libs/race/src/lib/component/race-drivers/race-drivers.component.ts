import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { AsyncPipe } from '@angular/common';
import { Component, OnInit, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RaceStore } from '@f2020/api';
import { IRace } from '@f2020/data';
import { AddDriverComponent, DriverNamePipe } from '@f2020/driver';
import { icon, LoadingComponent } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UntilDestroy } from '@ngneat/until-destroy';
import { first } from 'rxjs/operators';

type Operation = 'removed' | 'added' | 'moved' | 'undo';

const message = (driverName: string, operation: Operation) => {
  switch (operation) {
    case 'added':
      return `${driverName} er blevet tilføjet`;
    case 'moved':
      return `${driverName} er blevet flyttet`;
    case 'removed':
      return `${driverName} er blevet fjernet`;
  }
};

@UntilDestroy()
@Component({
  selector: 'race-drivers',
  templateUrl: './race-drivers.component.html',
  styleUrls: ['./race-drivers.component.scss'],
  standalone: true,
  imports: [MatToolbarModule, MatListModule, CdkDropList, CdkDrag, MatButtonModule, FontAwesomeModule, MatIconModule, LoadingComponent, AsyncPipe, DriverNamePipe],
})
export class RaceDriversComponent implements OnInit {

  race: Signal<IRace>;
  removeIcon = icon.farTrash;
  addIcon = icon.farPlus;
  private operation: Operation;
  private previousDrivers: string[];

  constructor(
    private raceStore: RaceStore,
    private dialog: MatDialog,
    private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.race = this.raceStore.race;
  }

  drop(event: CdkDragDrop<string[]>) {
    const driver = this.race().drivers[event.previousIndex];
    const drivers = [...this.race().drivers];
    const previousDrivers = [...drivers];

    moveItemInArray(drivers, event.previousIndex, event.currentIndex);
    this.updateDrivers('moved', drivers, driver, previousDrivers);
  }

  removeDriver(index: number): void {
    const drivers = [...this.race().drivers];
    const driver = drivers[index];
    const previousDrivers = [...drivers];
    drivers.splice(index, 1); // Switch toSliced
    this.updateDrivers('removed', drivers, driver, previousDrivers);
  }

  addDriver() {
    const drivers = [...this.race().drivers];
    const previousDrivers = [...drivers];
    this.dialog.open(AddDriverComponent, { data: drivers }).afterClosed().pipe(
      first(),
    ).subscribe(driver => this.updateDrivers('added', [...drivers, driver], driver, previousDrivers));
  }

  private updateDrivers(operation: Operation, drivers: string[], driverId?: string, previousDrivers?: string[]) {
    this.operation = operation;
    this.previousDrivers = previousDrivers;
    this.raceStore.updateDrivers(drivers).then(() => {
      operation !== 'undo' && this.snackBar.open(message(driverId, this.operation), 'UNDO', { duration: 5000 }).onAction().pipe(
        first(),
      ).subscribe(() => this.updateDrivers('undo', this.previousDrivers, driverId));
    });
  }

}

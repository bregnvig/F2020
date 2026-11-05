import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DriverService, DriversStore } from '@f2020/api';
import { IDriver } from '@f2020/data';
import { DriverHeadshotComponent, LoadingComponent } from '@f2020/shared';
import { filter, switchMap } from 'rxjs';
import { EditDriverDialog } from './edit-driver-dialog';

@Component({
  selector: 'drivers-list',
  template: `
    <mat-toolbar color="primary">
      <span>Kørere</span>
    </mat-toolbar>
    <div class="max-w-3xl mx-auto px-4 pt-4">
      @if (store.loaded()) {
        <mat-form-field class="w-full" subscriptSizing="dynamic">
          <mat-label>Søg</mat-label>
          <input matInput type="search" [value]="search()" (input)="search.set($any($event.target).value)" />
          <mat-hint>Navn, forkortelse, hold eller nummer</mat-hint>
        </mat-form-field>
        <mat-action-list>
          @for (driver of drivers(); track driver.driverId) {
            <button mat-list-item (click)="edit(driver)">
              <sha-driver-headshot matListItemAvatar [driver]="driver" />
              <span matListItemTitle>{{ driver.name }}</span>
              <span matListItemLine>
                {{ driver.code }}
                @if (driver.activeNumber) {
                  · #{{ driver.activeNumber }}
                }
                @if (driver.teamName) {
                  · {{ driver.teamName }}
                }
              </span>
            </button>
          } @empty {
            <p class="text-on-surface-variant p-4">Ingen kørere fundet</p>
          }
        </mat-action-list>
      } @else {
        <sha-loading />
      }
    </div>
  `,
  imports: [MatToolbarModule, MatListModule, MatFormFieldModule, MatInputModule, DriverHeadshotComponent, LoadingComponent],
})
export class DriversList {
  readonly #dialog = inject(MatDialog);
  readonly #service = inject(DriverService);
  readonly #snackBar = inject(MatSnackBar);
  protected readonly store = inject(DriversStore);
  protected readonly search = signal('');

  protected readonly drivers = computed(() => {
    const search = this.search().trim().toLowerCase();
    return (this.store.drivers() ?? []).filter(
      driver => !search || [driver.name, driver.code, driver.teamName, ...driver.permanentNumbers.map(String)].some(value => value?.toLowerCase().includes(search)),
    );
  });

  protected edit(driver: IDriver) {
    this.#dialog
      .open<EditDriverDialog, IDriver, IDriver>(EditDriverDialog, { data: driver, width: '36rem' })
      .afterClosed()
      .pipe(
        filter(edited => !!edited),
        switchMap(edited => this.#service.updateDriver(edited).then(() => edited)),
      )
      .subscribe({
        next: edited => this.#snackBar.open(`${edited.name} er gemt`, undefined, { duration: 2000 }),
        error: error => this.#snackBar.open(`${driver.name} kunne ikke gemmes: ${error?.message ?? error}`, 'Luk'),
      });
  }
}

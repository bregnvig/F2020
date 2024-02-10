import { ChangeDetectionStrategy, Component, computed, Inject, OnInit, Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { map, startWith } from 'rxjs/operators';
import { DriverNamePipe } from '../../pipe/driver-name.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { AsyncPipe, NgFor } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { toSignal } from '@angular/core/rxjs-interop';
import { DriversStore } from '@f2020/api';

@Component({
  templateUrl: './add-driver.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatAutocompleteModule, NgFor, MatOptionModule, MatButtonModule, AsyncPipe, DriverNamePipe],
})
export class AddDriverComponent implements OnInit {

  filteredDrivers: Signal<string[]>;
  driverControl = new FormControl(null, Validators.required);

  #term: Signal<string>;

  constructor(
    private store: DriversStore,
    @Inject(MAT_DIALOG_DATA) public currentDrivers: string[]) {
    this.#term = toSignal(this.driverControl.valueChanges.pipe(
      startWith(''),
      map<string, string>(term => term.toLocaleLowerCase()),
    ));
  }

  ngOnInit() {
    this.filteredDrivers = computed(() => {
      const drivers = (this.store.drivers() ?? []).filter(driver => !this.currentDrivers.some(currentDriver => currentDriver === driver.driverId));
      return drivers.filter(driver => driver.name.toLocaleLowerCase().includes(this.#term())).map(d => d.driverId);
    });
  }
}

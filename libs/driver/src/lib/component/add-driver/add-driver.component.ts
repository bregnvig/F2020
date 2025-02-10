import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { map, startWith } from 'rxjs/operators';
import { DriverNamePipe } from '../../pipe/driver-name.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { toSignal } from '@angular/core/rxjs-interop';
import { DriversStore } from '@f2020/api';

@Component({
  templateUrl: './add-driver.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatAutocompleteModule, MatOptionModule, MatButtonModule, DriverNamePipe],
})
export class AddDriverComponent {

  filteredDrivers: Signal<string[]>;
  driverControl = new FormControl(null, Validators.required);
  currentDrivers = inject<string[]>(MAT_DIALOG_DATA);
  #term: Signal<string>;

  constructor() {
    this.#term = toSignal(this.driverControl.valueChanges.pipe(
      startWith(''),
      map<string, string>(term => term.toLocaleLowerCase()),
    ));
    const store = inject(DriversStore);
    this.filteredDrivers = computed(() => {
      const drivers = (store.drivers() ?? []).filter(driver => !this.currentDrivers.some(currentDriver => currentDriver === driver.driverId));
      return drivers.filter(driver => driver.name.toLocaleLowerCase().includes(this.#term())).map(d => d.driverId);
    });
  }
}

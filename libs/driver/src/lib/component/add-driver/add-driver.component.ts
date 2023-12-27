import { ChangeDetectionStrategy, Component, computed, Inject, OnInit, Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DriverNamePipe } from '../../pipe/driver-name.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { AsyncPipe, NgFor } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DriversStore } from '../../+state';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  templateUrl: './add-driver.component.html',
  styleUrls: ['./add-driver.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatAutocompleteModule, NgFor, MatOptionModule, MatButtonModule, AsyncPipe, DriverNamePipe],
})
export class AddDriverComponent implements OnInit {

  filteredDrivers$: Observable<string[]>;
  filteredDrivers: Signal<string[]>;
  driverControl = new FormControl(null, Validators.required);

  constructor(
    private store: DriversStore,
    @Inject(MAT_DIALOG_DATA) public currentDrivers: string[]) {
  }

  ngOnInit() {
    const term = toSignal(this.driverControl.valueChanges.pipe(
      startWith(''),
      map<string, string>(term => term.toLocaleLowerCase()),
    ));
    this.filteredDrivers = computed(() => {
      const drivers = (this.store.drivers() ?? []).filter(driver => !this.currentDrivers.some(currentDriver => currentDriver === driver.driverId));
      return drivers.filter(driver => driver.name.toLocaleLowerCase().includes(term())).map(d => d.driverId);
    });
  }
}

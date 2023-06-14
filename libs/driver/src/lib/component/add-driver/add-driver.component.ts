import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { DriversFacade } from '@f2020/driver';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { DriverNamePipe } from '../../pipe/driver-name.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { NgFor, AsyncPipe } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    templateUrl: './add-driver.component.html',
    styleUrls: ['./add-driver.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatAutocompleteModule, NgFor, MatOptionModule, MatButtonModule, AsyncPipe, DriverNamePipe]
})
export class AddDriverComponent implements OnInit {

  filteredDrivers$: Observable<string[]>;
  driverControl = new FormControl(null, Validators.required);

  constructor(
    private facade: DriversFacade,
    @Inject(MAT_DIALOG_DATA) public currentDrivers: string[]) { }

  ngOnInit() {
    const drivers$ = this.facade.allDriver$.pipe(
      map(drivers => drivers.filter(driver => !this.currentDrivers.some(currentDriver => currentDriver === driver.driverId))),
    );
    this.filteredDrivers$ = combineLatest([
      drivers$,
      this.driverControl.valueChanges.pipe(
        startWith(''),
        map<string, string>(term => term.toLocaleLowerCase())
      )
    ]).pipe(
      map(([drivers, term]) => drivers.filter(driver => driver.name.toLocaleLowerCase().includes(term))),
      map(drivers => drivers.map(d => d.driverId))
    );
  }
}

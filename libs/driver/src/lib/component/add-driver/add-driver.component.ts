import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { DriversFacade } from '@f2020/driver';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

@Component({
  templateUrl: './add-driver.component.html',
  styleUrls: ['./add-driver.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
    )
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

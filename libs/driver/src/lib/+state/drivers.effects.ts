import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { DriverService } from '../service/driver.service';
import { DriversActions } from './drivers.actions';

export const loadDrivers = createEffect((
  actions$ = inject(Actions),
  service = inject(DriverService)
) => actions$.pipe(
  ofType(DriversActions.loadDrivers),
  concatMap(() => service.drivers$.pipe(
    map(drivers => DriversActions.loadDriversSuccess({ drivers })),
    catchError(error => of(DriversActions.loadDriversFailure({ error }))),
  )),
), { functional: true });


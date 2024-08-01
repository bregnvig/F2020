import { inject } from '@angular/core';
import { IDriver } from '@f2020/data';
import { DriverService } from '../service/driver.service';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';

export interface DriversState {
  drivers: IDriver[] | undefined,
  loaded: boolean; // has the Driver list been loaded
  error: string | undefined; // last none error (if any)
}

const initialState: DriversState = {
  loaded: false,
  drivers: undefined,
  error: undefined,
};

export const DriversStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(DriverService)) => ({
    loadDrivers: rxMethod<void>(
      pipe(
        tap(() => patchState(store, initialState)),
        switchMap(() => service.drivers$.pipe(
          tapResponse({
            next: drivers => patchState(store, { drivers, loaded: true }),
            error: error => patchState(store, { error: error?.toString() }),
          })),
        ),
      ),
    ),
  })),
);

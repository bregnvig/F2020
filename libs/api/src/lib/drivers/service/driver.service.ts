import { inject, Service } from '@angular/core';
import { collection, collectionData, doc, Firestore, setDoc } from '@angular/fire/firestore';
import { IDriver } from '@f2020/data';
import { filterNullish } from '@f2020/tools';
import { Observable } from 'rxjs';
import { map, share } from 'rxjs/operators';

@Service()
export class DriverService {
  readonly #afs = inject(Firestore);
  readonly drivers$: Observable<IDriver[]>;

  constructor() {
    this.drivers$ = collectionData(collection(this.#afs, 'drivers')).pipe(
      map<IDriver[], IDriver[]>(drivers => drivers.sort((a, b) => a.name.localeCompare(b.name))),
      share(),
    );
  }

  /** Replaces the driver, so a field left out is removed. Firestore rejects undefined, so they are left out */
  updateDriver(driver: IDriver): Promise<void> {
    return setDoc(doc(this.#afs, `drivers/${driver.driverId}`), filterNullish(driver));
  }
}

import { inject, Service } from '@angular/core';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { IDriver } from '@f2020/data';
import { Observable } from 'rxjs';
import { map, share } from 'rxjs/operators';

@Service()
export class DriverService {

  readonly drivers$: Observable<IDriver[]>;

  constructor() {
    const afs = inject(Firestore);
    this.drivers$ = collectionData(collection(afs, 'drivers')).pipe(
      map<IDriver[], IDriver[]>(drivers => drivers.sort((a, b) => a.name.localeCompare(b.name))),
      share()
    );
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { IDriver } from '@f2020/data';
import { Observable } from 'rxjs';
import { map, share } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DriverService {

  readonly drivers$: Observable<IDriver[]>;

  constructor(private http: HttpClient, private afs: AngularFirestore) {
    this.drivers$ = this.afs.collection<IDriver>('drivers').valueChanges().pipe(
      map(drivers => drivers.sort((a, b) => a.name.localeCompare(b.name))),
      share()
    );
  }
}

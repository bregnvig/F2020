import { Injectable } from '@angular/core';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { converter, IDriverResult, IDriverStanding } from '@f2020/data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class StandingService {

  constructor(private afs: Firestore) {
  }

  getStandings(seasonId: string | number): Observable<IDriverStanding[]> {
    return docData(doc(this.afs, `seasons/${seasonId}/standings/all-drivers`).withConverter(converter.timestamp<{ standing: IDriverStanding[]; }>())).pipe(
      map(({ standing }) => standing),
    );
  }

  getDriverResult(seasonId: string | number, resultSeasonId: string | number, driverId: string): Observable<IDriverResult> {
    return docData(doc(this.afs, `seasons/${seasonId}/standings/drivers/${resultSeasonId}/${driverId}`).withConverter(converter.timestamp<IDriverResult>()));
  }

}

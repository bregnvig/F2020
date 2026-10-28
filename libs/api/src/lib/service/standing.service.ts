import { inject, Service } from '@angular/core';
import { collection, collectionData, doc, docData, Firestore } from '@angular/fire/firestore';
import { converter } from '../converter';
import { IDriverResult, IDriverStanding } from '@f2020/data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Service()
export class StandingService {
  #afs = inject(Firestore);

  getStandings(seasonId: string | number): Observable<IDriverStanding[]> {
    return docData(doc(this.#afs, `seasons/${seasonId}/standings/all-drivers`).withConverter(converter.timestamp<{ standing: IDriverStanding[] }>())).pipe(
      map(doc => (doc?.standing ?? []) as IDriverStanding[]),
    );
  }

  getDriverResult(seasonId: string | number, resultSeasonId: string | number, driverId: string): Observable<IDriverResult> {
    return docData(doc(this.#afs, `seasons/${seasonId}/standings/drivers/${resultSeasonId}/${driverId}`).withConverter(converter.timestamp<IDriverResult>())).pipe(
      map(result => result as IDriverResult),
    );
  }

  /** The results of every driver in a season, with the id of the driver */
  getDriverResults(seasonId: string | number, resultSeasonId: string | number): Observable<(IDriverResult & { driverId: string })[]> {
    return collectionData(collection(this.#afs, `seasons/${seasonId}/standings/drivers/${resultSeasonId}`).withConverter(converter.timestamp<IDriverResult & { driverId: string }>()), {
      idField: 'driverId',
    }).pipe(map(results => results as (IDriverResult & { driverId: string })[]));
  }
}

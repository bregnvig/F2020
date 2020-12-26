import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { firestoreUtils, ISeason } from '@f2020/data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SeasonService {

  static readonly seasonsURL = 'seasons';

  readonly current$: Observable<ISeason> = this.afs.collection<any>(SeasonService.seasonsURL, ref => ref.where('current', '==', true)).valueChanges().pipe(
    map(firestoreUtils.convertTimestamps),
    map(seasons => {
      if (seasons.length === 0) {
        throw new Error('No current season available');
      } else if (seasons.length > 1) {
        throw new Error(`Should only return one season.  Returned ${seasons.length}`);
      }
      return seasons[0];
    }),
  );

  readonly previous$: Observable<ISeason[]> = this.afs.collection<any>(SeasonService.seasonsURL, ref => ref.where('current', '==', false)).valueChanges().pipe(
    map(firestoreUtils.convertTimestamps),
  );

  constructor(private afs: AngularFirestore) {
  }
}

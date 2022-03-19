import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { firestoreUtils, ISeason } from '@f2020/data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SeasonService {

  static readonly seasonsURL = 'seasons';

  readonly previous$: Observable<ISeason[]> = this.afs.collection<ISeason>(SeasonService.seasonsURL, ref => ref.where('current', '==', false)).valueChanges().pipe(
    map(seasons => firestoreUtils.convertTimestamps(seasons)),
  );

  constructor(private afs: AngularFirestore) {
  }

  loadSeason(id: string): Observable<ISeason> {
    return this.afs.doc<ISeason>(`${SeasonService.seasonsURL}/${id}`).valueChanges().pipe(
      map(season => firestoreUtils.convertTimestamps<ISeason>(season)),
      map(season => {
        if (!season) {
          throw new Error(`No season found with id ${id}`);
        }
        return season;
      }),
    );
  }
}

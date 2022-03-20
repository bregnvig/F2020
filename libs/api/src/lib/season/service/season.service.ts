import { Injectable } from '@angular/core';
import { collection, collectionData, doc, docData, Firestore, query, where } from '@angular/fire/firestore';
import { converter, ISeason } from '@f2020/data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const seasonConverter = converter.timestamp<ISeason>();

@Injectable({
  providedIn: 'root',
})
export class SeasonService {

  static readonly seasonsURL = 'seasons';

  readonly previous$: Observable<ISeason[]> = collectionData(query(
    collection(this.afs, SeasonService.seasonsURL).withConverter(seasonConverter),
    where('current', '==', false)
  ));

  constructor(private afs: Firestore) {
  }

  loadSeason(id: string): Observable<ISeason> {
    return docData(doc(this.afs, `${SeasonService.seasonsURL}/${id}`).withConverter(seasonConverter)).pipe(
      map(season => {
        if (!season) {
          throw new Error(`No season found with id ${id}`);
        }
        return season;
      }),
    );
  }
}

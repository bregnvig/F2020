import { inject, Injectable } from '@angular/core';
import { collection, collectionData, doc, docData, Firestore, query, where } from '@angular/fire/firestore';
import { ISeason } from '@f2020/data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { converter } from '../../converter';

const seasonConverter = converter.timestamp<ISeason>();

@Injectable({
  providedIn: 'root',
})
export class SeasonService {

  static readonly seasonsURL = 'seasons';
  #afs = inject(Firestore);

  readonly previous$: Observable<ISeason[]> = collectionData(query(
    collection(this.#afs, SeasonService.seasonsURL).withConverter(seasonConverter),
    where('current', '==', false),
  )).pipe(
    map(seasons => seasons as ISeason[]),
  );

  loadSeason(id: string): Observable<ISeason> {
    return docData(doc(this.#afs, `${SeasonService.seasonsURL}/${id}`).withConverter(seasonConverter)).pipe(
      map(season => {
        if (!season) {
          throw new Error(`No season found with id ${id}`);
        }
        return season as ISeason;
      }),
    );
  }
}

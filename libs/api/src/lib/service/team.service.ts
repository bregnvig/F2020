import { inject, Injectable } from '@angular/core';
import { collection, collectionData, doc, Firestore, setDoc } from '@angular/fire/firestore';
import { ITeam } from '@f2020/data';
import { truthy } from '@f2020/tools';
import { Observable } from 'rxjs';
import { first, map, shareReplay, switchMap } from 'rxjs/operators';
import { converter, SeasonStore } from '@f2020/api';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class TeamService {

  #afs = inject(Firestore);
  readonly #store = inject(SeasonStore);

  teams$: Observable<ITeam[]>;

  constructor() {
    this.teams$ = toObservable(this.#store.season).pipe(
      truthy(),
      first(),
      switchMap(season => collectionData(collection(this.#afs, `seasons/${season.id}/teams`).withConverter(converter.timestamp<ITeam>()))),
      map(teams => teams as ITeam[]),
      shareReplay(1),
    );
  }

  getTeam(constructorId: string): Observable<ITeam> {
    return this.teams$.pipe(
      map(teams => teams.find(t => t.constructorId === constructorId)),
    );
  }

  updateTeam(team: ITeam): Promise<void> {
    return setDoc(doc(this.#afs, `seasons/${this.#store.season().id}/teams/${team.constructorId}`), team);
  }
}

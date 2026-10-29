import { inject, Service, Signal } from '@angular/core';
import { collection, collectionData, doc, docData, Firestore, setDoc } from '@angular/fire/firestore';
import { ITeam, ITeamStandings } from '@f2020/data';
import { truthy } from '@f2020/tools';
import { Observable } from 'rxjs';
import { first, map, shareReplay, switchMap } from 'rxjs/operators';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { SeasonStore } from '../season/+state';
import { converter } from '../converter';

@Service()
export class TeamService {
  readonly #fs = inject(Firestore);
  readonly #store = inject(SeasonStore);

  readonly teams$: Observable<ITeam[]>;
  readonly teams: Signal<ITeam[]>;
  /** The championship of the teams by constructor id. Empty until the first race is completed */
  readonly standings$: Observable<ITeamStandings>;
  readonly standings: Signal<ITeamStandings | undefined>;

  constructor() {
    this.teams$ = toObservable(this.#store.season).pipe(
      truthy(),
      first(),
      switchMap(season => collectionData(collection(this.#fs, `seasons/${season.id}/teams`).withConverter(converter.timestamp<ITeam>()))),
      map(teams => teams as ITeam[]),
      shareReplay(1),
    );
    this.teams = toSignal(this.teams$, { initialValue: [] });
    this.standings$ = toObservable(this.#store.season).pipe(
      truthy(),
      first(),
      switchMap(season => docData(doc(this.#fs, `seasons/${season.id}/standings/teams`).withConverter(converter.timestamp<ITeamStandings>()))),
      map(standings => standings ?? {}),
      shareReplay(1),
    );
    this.standings = toSignal(this.standings$);
  }

  updateTeam(team: ITeam): Promise<void> {
    return setDoc(doc(this.#fs, `seasons/${this.#store.season().id}/teams/${team.constructorId}`), team);
  }
}

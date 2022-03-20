import { Injectable } from "@angular/core";
import { collection, Firestore, getDocs } from "@angular/fire/firestore";
import { ITeam } from '@f2020/data';
import { truthy } from '@f2020/tools';
import { Observable } from 'rxjs';
import { first, map, shareReplay, switchMap } from 'rxjs/operators';
import { SeasonFacade } from '../season/+state';

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  teams$: Observable<ITeam[]>;

  constructor(facade: SeasonFacade, afs: Firestore) {
    this.teams$ = facade.season$.pipe(
      truthy(),
      first(),
      switchMap(season => getDocs(collection(afs, `seasons/${season.id}/teams`))),
      map(snapshot => snapshot.docs.map(doc => doc.data() as ITeam)),
      shareReplay(1),
    );
  }

  getTeam(constructorId: string): Observable<ITeam> {
    return this.teams$.pipe(
      map(teams => teams.find(t => t.constructorId === constructorId))
    );
  }
}
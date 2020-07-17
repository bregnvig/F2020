import { Injectable } from "@angular/core";
import { AngularFirestore } from '@angular/fire/firestore';
import { ITeam } from '@f2020/data';
import { truthy } from '@f2020/tools';
import { Observable } from 'rxjs';
import { debounce, first, map, switchMap } from 'rxjs/operators';
import { SeasonFacade } from '../season/+state';

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  teams$: Observable<ITeam[]>;

  constructor(facade: SeasonFacade, afs: AngularFirestore) {
    this.teams$ = facade.season$.pipe(
      truthy(),
      first(),
      switchMap(season => afs.collection<ITeam>(`seasons/${season.id}/teams`).get()),
      map(snapshot => snapshot.docs.map(doc => doc.data() as ITeam))
    );
  }

  getTeam(constructorId: string): Observable<ITeam> {
    return this.teams$.pipe(
      map(teams => teams.find(t => t.constructorId === constructorId))
    );
  }
}
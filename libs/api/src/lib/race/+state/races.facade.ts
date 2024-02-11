import { Injectable } from '@angular/core';
import { Action, select, Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import * as fromRaces from './races.reducer';
import * as RacesSelectors from './races.selectors';

@Injectable({
  providedIn: 'root',
})
export class RacesFacade {
  updating$ = this.store.pipe(select(RacesSelectors.getUpdating));
  allRaces$ = this.store.pipe(select(RacesSelectors.getAllRaces));
  currentRace$ = this.store.pipe(select(RacesSelectors.getCurrentRace));
  selectedRace$ = this.store.pipe(select(RacesSelectors.getSelected), filter(race => !!race));
  lastYear$ = this.store.pipe(select(RacesSelectors.getLastYear));
  result$ = this.store.pipe(select(RacesSelectors.getResult));
  interimResult$ = this.store.pipe(select(RacesSelectors.getInterimResult));

  constructor(private store: Store<fromRaces.RacesPartialState>) {
  }

  dispatch(action: Action) {
    this.store.dispatch(action);
  }
}

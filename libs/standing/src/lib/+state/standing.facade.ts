import { Injectable } from '@angular/core';

import { select, Store, Action } from '@ngrx/store';

import * as fromStanding from './standing.reducer';
import * as StandingSelectors from './standing.selectors';

@Injectable({
  providedIn: 'root',
})
export class StandingFacade {
  loaded$ = this.store.pipe(select(StandingSelectors.getStandingLoaded));
  error$ = this.store.pipe(select(StandingSelectors.getStandingError));
  standings$ = this.store.pipe(select(StandingSelectors.getStandings));

  constructor(private store: Store<fromStanding.StandingPartialState>) {}

  dispatch(action: Action) {
    this.store.dispatch(action);
  }
}

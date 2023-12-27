import { effect, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SeasonFacade } from '@f2020/api';
import { IDriverStanding } from '@f2020/data';
import { Store } from '@f2020/shared';
import { truthy } from '@f2020/tools';
import { UntilDestroy } from '@ngneat/until-destroy';
import { switchMap } from 'rxjs';
import { StandingService } from '../service/standing.service';

export interface StandingState {
  standings?: IDriverStanding[];
  loaded: boolean; // has the Standing list been loaded
  error?: string | null; // last none error (if any)
}

const initialState: StandingState = {
  // set initial required properties
  loaded: false,
};

@UntilDestroy()
@Injectable()
export class StandingStore extends Store<StandingState> {
  constructor(private service: StandingService, private facade: SeasonFacade) {
    super(initialState);
  }

  loadStandings() {
    if (!this.loaded()) {
      const standings = toSignal(this.facade.season$.pipe(
        truthy(),
        switchMap(season => this.service.getStandings(season.id)),
      ));
      effect(() => this.setState(() => ({ standings: standings(), loaded: true })));
    }
  }

  get standings(): Signal<IDriverStanding[]> {
    return this.select(state => state.standings);
  }

  get loaded(): Signal<boolean> {
    return this.select(state => !state.loaded);
  }

  get error(): Signal<string | null> {
    return this.select(state => state.error);
  }

}

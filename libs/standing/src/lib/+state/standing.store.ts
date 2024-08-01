import { inject, Injectable } from '@angular/core';
import { SeasonStore, Store } from '@f2020/api';
import { IDriverStanding } from '@f2020/data';
import { UntilDestroy } from '@ngneat/until-destroy';
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
  standings = this.state.standings;
  loaded = this.state.loaded;
  error = this.state.error;

  #season = inject(SeasonStore).season;

  constructor(private service: StandingService) {
    super(initialState);
  }

  loadStandings() {
    this.service.getStandings(this.#season().id).subscribe(standings => this.setState(() => ({ standings, loaded: true })));
  }
}

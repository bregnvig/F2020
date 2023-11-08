import { Injectable, Signal } from "@angular/core";
import { SeasonFacade } from "@f2020/api";
import { IDriverStanding } from "@f2020/data";
import { Store } from "@f2020/shared";
import { truthy } from "@f2020/tools";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { switchMap } from "rxjs";
import { StandingService } from "../service/standing.service";

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
    this.setState(state => ({ ...state, loaded: false, error: null }));
    !this.state().loaded && this.facade.season$.pipe(
      truthy(),
      switchMap(season => this.service.getStandings(season.id)),
      untilDestroyed(this)).subscribe({
        next: standings => {
          this.setState(state => ({ ...state, standings, loaded: true }));
        },
        error: error => {
          console.error(error);
          this.setState(state => ({ ...state, error: error['message'] ?? error, loaded: false }));
        }
      });
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
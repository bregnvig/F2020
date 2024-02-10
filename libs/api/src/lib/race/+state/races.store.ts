import { Bid, IRace, Participant, RoundResult } from '@f2020/data';
import { effect, Injectable, Signal } from '@angular/core';
import { Store } from '../../store';
import { SeasonStore } from '../../season/+state';
import { RacesService } from '../service/races.service';
import { PlayerStore } from '../../player';
import { Subscription } from 'rxjs';

interface RacesState {
  races?: IRace[];
  previousRace?: IRace;
  bid?: Partial<Bid>;
  participants?: Participant[];
  result?: Bid;
  loaded: boolean; // has the Races list been loaded
  error?: string | null; // last none error (if any)
  selectedId?: string; // which Races record has been selected
  yourBid?: Partial<Bid>;
  bids?: Bid[];
  currentBids?: Bid[];
  interimResult?: Partial<Bid>;
  lastYear?: RoundResult,
  updating: boolean; // Is something updating
}

@Injectable({ providedIn: 'root' })
export class RacesStore extends Store<RacesState> {

  races: Signal<IRace[]> = this.select(state => state.races);

  constructor(private seasonStore: SeasonStore, private service: RacesService, private playerStore: PlayerStore) {
    super({ loaded: false, updating: false });
  }

  loadRaces() {
    let s: Subscription;
    effect(() => {
      const isUnauthorized = this.playerStore.unauthorized();
      s?.unsubscribe();
      const seasonId = this.seasonStore.season()?.id;
      !isUnauthorized && seasonId && (s = this.service.getRaces(seasonId).subscribe(races => this.setState(() => ({ races, loaded: true }))));
    }, { allowSignalWrites: true });
  }
}

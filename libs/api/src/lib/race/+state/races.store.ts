import { Bid, IRace, Participant, RoundResult } from '@f2020/data';
import { computed, effect, Injectable, Signal } from '@angular/core';
import { Store } from '../../store';
import { SeasonStore } from '../../season/+state';
import { RacesService } from '../service/races.service';
import { PlayerStore } from '../../player';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { filterEquals } from '@f2020/tools';

interface RacesState {
  races?: IRace[];
  currentRace?: IRace;
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

  races: Signal<IRace[]> = this.state.races;
  currentRace: Signal<IRace> = computed(() => this.races()?.find(r => r.state === 'open' || r.state === 'closed'));
  yourBid = this.state.yourBid;
  lastYear = this.state.lastYear;

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

  loadYourBid() {
    let s: Subscription;
    effect(() => {
      s?.unsubscribe();
      const player = this.playerStore.player();
      const authorized = this.playerStore.authorized();
      const race = this.currentRace();
      const season = this.seasonStore.season();
      authorized && race && (s = this.service.getBid(season.id, race.round, player.uid).pipe(
        map(bid => bid || {}),
        filterEquals(),
      ).subscribe({
        next: yourBid => this.setState(() => ({ yourBid })),
        error: error => this.setState(() => ({ error })),
      }));
    }, { allowSignalWrites: true });
  }

  loadLastYear() {
    effect(() => {
      if (!this.playerStore.unauthorized() && this.races()?.length && !this.lastYear()) {
        const race = this.races()?.find(r => r.state === 'open' || r.state === 'closed');
        race && this.service.getLastYearResult(race.season, race.countryCode).then(
          lastYear => this.setState(() => ({ lastYear })),
          error => this.setState(() => ({ error })),
        );
      }
    }, { allowSignalWrites: true });
  }

}

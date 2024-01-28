import { Bid, IRace, Participant, RoundResult } from '@f2020/data';
import { computed, effect, Injectable, Signal } from '@angular/core';
import { Store } from '../../store';
import { SeasonStore } from '../../season/+state';
import { RacesService } from '../service/races.service';
import { PlayerStore } from '../../player';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

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
  selectedId = this.select(state => state.selectedId);
  currentRace = computed(() => this.races()?.find(r => r.state === 'open' || r.state === 'closed'));
  selectedRace: Signal<IRace | undefined> = computed(() => {
    return this.races()?.[this.selectedId()];
  });

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
      const unauthorized = this.playerStore.unauthorized();
      const race = this.currentRace();
      const season = this.seasonStore.season();
      !unauthorized && race && (s = this.service.getBid(season.id, race.round, player.uid).pipe(
        map(bid => bid || {}),
      ).subscribe({
        next: bid => this.setState(() => ({ bid, loaded: true, error: undefined })),
        error: error => this.setState(() => ({ error })),
      }));
    }, { allowSignalWrites: true });
  }

  loadBid(playerId: string) {
    let s: Subscription;
    effect(() => {
      s?.unsubscribe();
      const player = this.playerStore.player();
      const unauthorized = this.playerStore.unauthorized();
      const race = this.currentRace();
      const season = this.seasonStore.season();
      !unauthorized && race && (s = this.service.getBid(season.id, race.round, playerId).pipe(
      ).subscribe({
        next: bid => this.setState(() => ({ bid, error: undefined })),
        error: error => this.setState(() => ({ error })),
      }));
    }, { allowSignalWrites: true });
  }

  loadResult() {

  }
}

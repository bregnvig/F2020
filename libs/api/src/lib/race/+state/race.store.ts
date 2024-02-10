import { Bid, IRace, Participant } from '@f2020/data';
import { RacesStore } from './races.store';
import { effect, Injectable, signal } from '@angular/core';
import { RacesService } from '../service/races.service';
import { Store } from '../../store';
import { SeasonStore } from '../../season/+state';
import { PlayerStore } from '../../player';
import { DateTime } from 'luxon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

interface RaceState {
  race?: IRace;
  bid?: Partial<Bid>;
  bids?: Participant[] | Bid[];
  result?: Bid;
  loaded: boolean; // has the Races list been loaded
  error?: string | null; // last none error (if any)
  selectedId?: string; // which Races record has been selected
}

@Injectable()
export class RaceStore extends Store<RaceState> {

  readonly race = this.select(state => state.race);
  readonly bid = this.select(state => state.bid);
  readonly bids = this.select(state => state.bids);
  readonly result = this.select(state => state.result);
  readonly loaded = this.select(state => state.loaded);
  readonly error = this.select(state => state.error);

  #round = signal<number | undefined>(undefined);

  constructor(
    private racesStore: RacesStore,
    private service: RacesService,
    private seasonStore: SeasonStore,
    private snackBar: MatSnackBar,
    private playerStore: PlayerStore) {
    super({ loaded: false });
    effect(() => {
      const player = this.playerStore.player();
      const unauthorized = this.playerStore.unauthorized();
      const race = this.racesStore.races()?.find(r => r.round === this.#round());
      if (race !== this.race()) {
        const closed = race.close < DateTime.now();
        const season = this.seasonStore.season();
        if (!unauthorized && race) {
          (closed
            ? this.service.getBids(season.id, race, player.uid)
            : this.service.getParticipants(season.id, race)).subscribe({
            next: bids => this.setState(() => ({ race, bids, loaded: true, error: undefined })),
            error: error => this.setState(() => ({ error })),
          });
          // closed &&
        }
      }
    }, { allowSignalWrites: true });
  }

  loadRace(round: number) {
    this.#round.set(round);
  }

  rollback() {
    return this.service.rollbackResult(this.#round()).then(() => this.snackBar.open(`✔ Resultat for ${this.race().name} er blevet rullet tilbage`, null, { duration: 3000 }));
  }

  cancel() {
    return this.service.cancelRace(this.#round()).then(() => this.snackBar.open(`✔ ${this.race().name} er blevet aflyst`, null, { duration: 3000 }));
  }

  update(race: IRace) {
    return this.service.updateRaceV2(race).then(() => this.snackBar.open(`✔ ${race.name} er blevet opdateret`, null, { duration: 3000 }));
  }

  updateDrivers(drivers: string[]) {
    return this.service.updateRace(this.seasonStore.season().id, this.#round(), { drivers });
  }

  loadYourBid() {
    let s: Subscription;
    effect(() => {
      s?.unsubscribe();
      const player = this.playerStore.player();
      const unauthorized = this.playerStore.unauthorized();
      const race = this.race();
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
      const unauthorized = this.playerStore.unauthorized();
      const race = this.race();
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

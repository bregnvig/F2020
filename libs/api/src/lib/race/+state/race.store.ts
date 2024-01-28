import { Bid, IRace, Participant } from '@f2020/data';
import { RacesStore } from './races.store';
import { effect, Injectable, signal } from '@angular/core';
import { RacesService } from '../service/races.service';
import { Store } from '../../store';
import { SeasonStore } from '../../season/+state';
import { PlayerStore } from '../../player';
import { DateTime } from 'luxon';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    this.service.rollbackResult(this.#round()).then(() => this.snackBar.open(`✔ Resultat for ${this.race().name} er blevet rullet tilbage`, null, { duration: 3000 }));
  }

  cancel() {
    this.service.cancelRace(this.#round()).then(() => this.snackBar.open(`✔ ${this.race().name} er blevet aflyst`, null, { duration: 3000 }));
  }
}

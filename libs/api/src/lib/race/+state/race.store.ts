import { Bid, IRace, Participant } from '@f2020/data';
import { RacesStore } from './races.store';
import { computed, effect, Injectable, signal } from '@angular/core';
import { RacesService } from '../service/races.service';
import { Store } from '../../store';
import { SeasonStore } from '../../season/+state';
import { PlayerStore } from '../../player';
import { DateTime } from 'luxon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, of, switchMap } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { buildInterimResult, buildResult } from '../service/result-builder';
import { DriversStore } from '../../drivers';
import { TeamService } from '../../service';

interface RaceState {
  race?: IRace;
  bids?: Participant[] | Bid[];
  bid?: Bid;
  interimResult?: Partial<Bid>;
  result?: Bid;
  loaded: boolean; // has the Races list been loaded
  error?: string | null; // last none error (if any)
  selectedId?: string; // which Races record has been selected
}

@Injectable()
export class RaceStore extends Store<RaceState> {

  readonly race = this.state.race;
  readonly bids = this.state.bids;
  readonly result = this.state.result;
  readonly loaded = computed(() => !!this.state.race());
  readonly error = this.state.error;
  readonly bid = computed(() => this.bids()?.find(bid => bid.player.uid === this.playerStore.player()?.uid));
  readonly interimResult = this.state.interimResult;

  #round = signal<number | undefined>(undefined);

  constructor(
    private racesStore: RacesStore,
    private service: RacesService,
    private seasonStore: SeasonStore,
    private driversStore: DriversStore,
    private snackBar: MatSnackBar,
    private teamsService: TeamService,
    private playerStore: PlayerStore) {
    super({ loaded: false });
    effect(() => {
      const player = this.playerStore.player();
      const unauthorized = this.playerStore.unauthorized();
      const race = this.racesStore.races()?.find(r => r.round === this.#round());
      if (!unauthorized && race) {
        const hasPlayedCurrentRace = racesStore.yourBid()?.submitted;
        const closed = race.close < DateTime.now();
        const season = this.seasonStore.season();
        ((closed || hasPlayedCurrentRace)
          ? this.service.getBids(season.id, race, player.uid)
          : this.service.getParticipants(season.id, race)).subscribe({
          next: bids => this.setState(() => ({ race, bids, loaded: true, error: undefined })),
          error: error => this.setState(() => ({ error })),
        });
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

  updateBid(bid: Bid) {
    if (bid && this.seasonStore.season() && this.playerStore.player()) {
      return this.service.updateBid(this.seasonStore.season().id, this.#round(), this.playerStore.player(), bid);
    }
    return Promise.resolve();
  }

  submitBid(bid: Bid) {
    return this.service.submitBid(bid, this.playerStore.player());
  }

  loadResult() {
    effect(() => {
      const race = this.race();
      if (race) {
        const offset = this.racesStore.races().filter(r => r.round < race.round && r.state === 'cancelled').length;
        this.teamsService.teams$.pipe(
          switchMap(teams => combineLatest([
            this.service.getResult(race.season, race.round - offset),
            this.service.getQualify(race.season, race.round - offset),
            this.service.getPitStops(race.season, race.round - offset, this.driversStore.drivers(), teams),
            of(race.selectedDriver),
            of(race.selectedTeam),
          ]))).pipe(
          map(([raceResult, qualify, pitStops, selectedDriver, selectedTeam]) => {
            return buildResult(raceResult, qualify, pitStops, selectedDriver, selectedTeam);
          }),
          first(),
        ).subscribe(result => this.setState(() => ({ result })));
      }
    });
  }

  submitResult(result: Bid) {
    return this.service.submitResult(this.#round(), result);
  }

  loadInterimResult() {
    effect(() => {
      const race = this.race();
      if (race) {
        const offset = this.racesStore.races().filter(r => r.round < race.round && r.state === 'cancelled').length;
        combineLatest([
          this.service.getQualify(race.season, race.round - offset),
          of(race.selectedDriver),
          of(race.selectedTeam),
        ]).pipe(
          map(([qualify, selectedDriver, selectedTeam]) => {
            return buildInterimResult(qualify, selectedDriver, selectedTeam);
          }),
          first(),
        ).subscribe(interimResult => this.setState(() => ({ interimResult })));
      }
    });
  }

  submitInterimResult(result: Bid) {
    return this.service.submitResult(this.#round(), result);
  }
}

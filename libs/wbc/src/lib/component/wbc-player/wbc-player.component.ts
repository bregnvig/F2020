import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeasonStore } from '@f2020/api';
import { Player, WBCResult } from '@f2020/data';
import { CardPageComponent, FlagURLPipe } from '@f2020/shared';


interface WBCRacePlayer {
  round: number;
  raceName: string;
  countryCode: string;
  points: number;
}

const racePlayer = (uid: string) => (wbc: WBCResult): WBCRacePlayer => ({
  round: wbc.round,
  raceName: wbc.raceName,
  countryCode: wbc.countryCode,
  points: wbc.players.find(p => p.player.uid === uid)?.points ?? 0,
});


@Component({
  templateUrl: './wbc-player.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, CardPageComponent, MatListModule, RouterLink, FlagURLPipe, NgOptimizedImage],
})
export class WbcPlayerComponent {

  #route = inject(ActivatedRoute);

  races: Signal<WBCRacePlayer[]>;
  player: Signal<Player>;

  constructor() {
    const store = inject(SeasonStore);
    const wbc = computed(() => store.season()?.wbc?.results);
    this.races = computed(() => wbc()?.map(racePlayer(this.#route.snapshot.params.uid)));
    this.player = computed(() => wbc()?.map(w => w.players).flat().find(player => player.player.uid === this.#route.snapshot.params.uid)?.player);
  }

}

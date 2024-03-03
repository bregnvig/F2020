import { ChangeDetectionStrategy, Component, computed, effect, HostBinding, Signal } from '@angular/core';
import { PlayerStore, SeasonStore } from '@f2020/api';
import { WBCResult } from '@f2020/data';
import { icon } from '@f2020/shared';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';
import { AsyncPipe, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'f2020-previous-race',
  templateUrl: './previous-race.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatCardModule, FontAwesomeModule, MatButtonModule, RouterLink, AsyncPipe, NgOptimizedImage],
})
export class PreviousRaceComponent {

  @HostBinding('hidden') isHidden = true;
  wbcResult: Signal<WBCResult>;
  title: Signal<string>;
  icon = icon.farTrophy;

  constructor(private store: SeasonStore, private playerStore: PlayerStore) {
    this.wbcResult = computed(() => this.store.season()?.wbc?.results?.at(-1));
    effect(() => this.isHidden = !this.wbcResult());

    this.title = computed(() => {
      const index = this.wbcResult()?.players.findIndex(p => p.player.uid === this.playerStore.player().uid);
      if (index >= 0 && index <= 2) {
        return `Tillykke med din ${index + 1}. plads!`;
      }
      return `Resultat for ${this.wbcResult()?.raceName}`;

    });
  }
}

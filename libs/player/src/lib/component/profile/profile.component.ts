import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { PlayersStore, PlayerStore } from '@f2020/api';
import { hiddenLandingCards, LandingCard, landingCards, Player } from '@f2020/data';
import { CardPageComponent } from '@f2020/shared';
import { NgOptimizedImage } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'f2020-profile',
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, MatCardModule, MatListModule, MatSlideToggleModule, NgOptimizedImage, CardPageComponent],
  providers: [PlayersStore],
})
export class ProfileComponent {

  #store = inject(PlayerStore);
  #playersStore = inject(PlayersStore);

  protected readonly receiveReminders = computed(() => this.#store.player()?.receiveReminders ?? true);
  protected readonly players = computed<[Player, boolean][]>(() => {
    const player = this.#store.player();
    return (this.#playersStore.players() ?? [])
      .filter(p => p.uid !== player?.uid)
      .map(p => [p, !player?.receiveBettingStarted || player.receiveBettingStarted.includes(p.uid)]);
  });
  protected readonly landingCards = computed(() => {
    const hidden = hiddenLandingCards(this.#store.player());
    return landingCards.map(c => ({ ...c, shown: !hidden.includes(c.card) }));
  });

  constructor() {
    this.#playersStore.loadPlayers();
  }

  protected selectionChanged(change: MatSelectionListChange) {
    const receiveBettingStarted: string[] = change.source.selectedOptions.selected.map(s => s.value);
    this.#store.updatePlayer({ receiveBettingStarted });
  }

  /** Deselecting every card shows them all */
  protected landingCardsChanged(change: MatSelectionListChange) {
    if (!change.source.selectedOptions.selected.length) {
      change.source.selectAll();
    }
    const shown: LandingCard[] = change.source.selectedOptions.selected.map(s => s.value);
    this.#store.updatePlayer({ hiddenLandingCards: landingCards.map(c => c.card).filter(card => !shown.includes(card)) });
  }

  protected updateReceiveReminders(receiveReminders: boolean) {
    this.#store.updatePlayer({ receiveReminders });
  }

}

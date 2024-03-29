import { Component, computed, OnInit, Signal } from '@angular/core';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { PlayersStore, PlayerStore } from '@f2020/api';
import { Player } from '@f2020/data';
import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'f2020-profile',
  templateUrl: './profile.component.html',
  standalone: true,
  imports: [MatToolbarModule, MatListModule, MatSlideToggleModule, AsyncPipe, NgOptimizedImage],
  providers: [PlayersStore],
})
export class ProfileComponent implements OnInit {

  receiveReminders: Signal<boolean>;
  player: Signal<Player>;
  players: Signal<[Player, boolean][]>;

  constructor(private store: PlayerStore, private playersStore: PlayersStore) {
    this.playersStore.loadPlayers();
    this.player = store.player;
  }

  ngOnInit(): void {
    this.players = computed(() => {
      const player = this.player();
      return (this.playersStore.players() ?? []).filter(p => p.uid !== player.uid).map(p => [p, !player.receiveBettingStarted || player.receiveBettingStarted.includes(p.uid)]);
    });
    this.receiveReminders = computed(() => this.player().receiveReminders ?? true);
  }

  selectionChanged(change: MatSelectionListChange) {
    const receiveBettingStarted: string[] = change.source.selectedOptions.selected.map(s => s.value);
    this.store.updatePlayer({ receiveBettingStarted });

  }

  updateReceiveReminders(receiveReminders: boolean) {
    this.store.updatePlayer({ receiveReminders });
  }

}

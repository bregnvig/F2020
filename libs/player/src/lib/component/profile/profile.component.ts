import { Component, computed, effect, OnInit, Signal } from '@angular/core';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { PlayerActions, PlayerFacade, PlayersStore } from '@f2020/api';
import { Player } from '@f2020/data';
import { truthy } from '@f2020/tools';
import { first } from 'rxjs/operators';
import { AsyncPipe, NgFor, NgOptimizedImage } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'f2020-profile',
  templateUrl: './profile.component.html',
  standalone: true,
  imports: [MatToolbarModule, MatListModule, MatSlideToggleModule, NgFor, AsyncPipe, NgOptimizedImage],
  providers: [PlayersStore],
})
export class ProfileComponent implements OnInit {

  receiveReminders: Signal<boolean>;
  player: Signal<Player>;
  players: Signal<[Player, boolean][]>;

  constructor(private facade: PlayerFacade, private playersStore: PlayersStore) {
    this.playersStore.loadPlayers();
    this.player = toSignal(this.facade.player$.pipe(truthy(), first()));
    effect(() => console.log(this.playersStore.players()));
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
    this.facade.dispatch(PlayerActions.updatePlayer({ partialPlayer: { receiveBettingStarted } }));

  }

  updateReceiveReminders(receiveReminders: boolean) {
    this.facade.dispatch(PlayerActions.updatePlayer({ partialPlayer: { receiveReminders } }));
  }

}

import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PlayerStore, SeasonStore } from '@f2020/api';
import { SeasonChart, SeasonLine } from '@f2020/shared';
import { wbcGraph } from '../../model/wbc-graph.model';

const palette = ['#e91e63', '#03a9f4', '#ffeb3b', '#4caf50', '#ff9800', '#ba68c8', '#00e5ff', '#f44336', '#cddc39', '#a1887f', '#90a4ae', '#ff80ab'];

@Component({
  selector: 'f2020-wbc-graph',
  templateUrl: './wbc-graph.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, MatListModule, MatButtonModule, NgOptimizedImage, SeasonChart],
})
export class WbcGraphComponent {
  #season = inject(SeasonStore);
  #player = inject(PlayerStore);

  #hidden = computed(() => this.#player.player()?.hiddenWBCPlayers ?? []);

  /** The players with the most WBC points first, each with a color of their own */
  protected readonly players = computed(() =>
    wbcGraph(this.#season.season().wbc)
      .sort((a, b) => b.points - a.points || a.player.displayName.localeCompare(b.player.displayName))
      .map((entry, index) => ({ ...entry, color: palette[index % palette.length], shown: !this.#hidden().includes(entry.player.uid) })),
  );

  protected readonly anyShown = computed(() => this.players().some(p => p.shown));

  protected readonly lines = computed<SeasonLine[]>(() =>
    this.players()
      .filter(p => p.shown)
      .map(({ player, color, races }) => ({ name: player.displayName, color, races })),
  );

  /** The value is the uid, as Material deselects an option when its value changes, and the players are built again on every change */
  protected toggle({ options: [option] }: MatSelectionListChange) {
    const hidden = this.#hidden().filter(uid => uid !== option.value);
    this.#player.updatePlayer({ hiddenWBCPlayers: option.selected ? hidden : [...hidden, option.value] });
  }

  protected showAll(show: boolean) {
    this.#player.updatePlayer({ hiddenWBCPlayers: show ? [] : this.players().map(p => p.player.uid) });
  }
}

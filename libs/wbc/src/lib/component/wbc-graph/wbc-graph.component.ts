import { Component, computed, effect, signal, Signal } from '@angular/core';
import { SeasonStore } from '@f2020/api';
import { Player } from '@f2020/data';
import { UntilDestroy } from '@ngneat/until-destroy';
import { WBCGraph, WBCGraphPlayerEntry } from '../../model/wbc-graph.model';
import { WBCGraphEntry } from './../../model/wbc-graph.model';
import { NgOptimizedImage } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { LineChartModule } from '@swimlane/ngx-charts';

interface GraphEntry {
  name: string;
  series: WBCGraphPlayerEntry[];
}

@UntilDestroy()
@Component({
  selector: 'f2020-wbc-graph',
  templateUrl: './wbc-graph.component.html',
  styleUrls: ['./wbc-graph.component.scss'],
  standalone: true,
  imports: [LineChartModule, MatListModule, NgOptimizedImage],
})
export class WbcGraphComponent {

  data: Signal<GraphEntry[]>;
  activeEntries: Signal<GraphEntry[]>;
  playerEntries: Signal<WBCGraphEntry[]>;

  private selected = signal<string[]>(JSON.parse(localStorage.getItem('selectedWBCPlayers')) ?? []);

  constructor(private store: SeasonStore) {
    const graph = computed(() => new WBCGraph(store.season().wbc));
    this.data = computed(() => graph()?.entries.map(e => ({
      name: e.player.displayName,
      series: e.entries,
    })));
    this.activeEntries = computed(() => this.data()?.filter(e => this.selected().includes(e.name)));
    effect(() => localStorage.setItem('selectedWBCPlayers', JSON.stringify(this.selected())));
    this.playerEntries = computed(() => [...graph()?.entries ?? []].sort((a, b) => b.points - a.points));
  }

  toggle(player: Player) {
    this.selected.set(this.selected().some(name => name === player.displayName)
      ? this.selected().filter(name => name !== player.displayName)
      : [...this.selected(), player.displayName],
    );
  }

  isSelected(entry: WBCGraphEntry): boolean {
    return (this.activeEntries() || []).some(e => e.name === entry.player.displayName);
  }

  // ngxBug() {
  //   this.activeEntries = [...this.activeEntries];
  // }
}

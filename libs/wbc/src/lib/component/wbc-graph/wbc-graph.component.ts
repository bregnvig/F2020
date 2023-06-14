import { Component, OnInit } from '@angular/core';
import { PlayerFacade, SeasonFacade } from '@f2020/api';
import { Player } from '@f2020/data';
import { shareLatest } from '@f2020/tools';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { WBCGraph } from '../../model/wbc-graph.model';
import { WBCGraphEntry } from './../../model/wbc-graph.model';
import { NgFor } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { LineChartModule } from '@swimlane/ngx-charts';

@UntilDestroy()
@Component({
    selector: 'f2020-wbc-graph',
    templateUrl: './wbc-graph.component.html',
    styleUrls: ['./wbc-graph.component.scss'],
    standalone: true,
    imports: [LineChartModule, MatListModule, NgFor]
})
export class WbcGraphComponent implements OnInit {

  data: any[];
  activeEntries: any[] = [];
  playerEntris: WBCGraphEntry[];

  constructor(private facade: SeasonFacade, private playerFacade: PlayerFacade) {
  }

  ngOnInit(): void {
    const graph$ = this.facade.season$.pipe(
      map(season => new WBCGraph(season.wbc)),
      shareLatest(),
    );
    combineLatest([
      graph$.pipe(
        map(data => data.entries.map(e => ({
          name: e.player.displayName,
          series: e.entries
        })))),
      this.playerFacade.player$
    ]).pipe(
      untilDestroyed(this),
    ).subscribe(([entries, player]) => {
      this.data = entries;
      this.activeEntries = entries.filter(e => e.name === player.displayName);
    });
    graph$.pipe(untilDestroyed(this)).subscribe(players => this.playerEntris = [...players.entries].sort((a, b) => b.points - a.points));
  }

  toggle(player: Player) {
    if (this.activeEntries.some(e => e.name === player.displayName)) {
      this.activeEntries = this.activeEntries.filter(e => e.name !== player.displayName);
    } else {
      this.activeEntries = [...this.activeEntries, this.data.find(data => data.name === player.displayName)];
    }
  }

  isSelected(entry: WBCGraphEntry): boolean {
    return (this.activeEntries || []).some(e => e.name === entry.player.displayName);
  }

  ngxBug() {
    this.activeEntries = [...this.activeEntries];
  }
}

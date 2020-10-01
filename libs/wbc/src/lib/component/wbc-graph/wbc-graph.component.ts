import { Component, OnInit } from '@angular/core';
import { SeasonFacade, PlayerFacade } from '@f2020/api';
import { Player } from '@f2020/data';
import { AbstractSuperComponent } from '@f2020/shared';
import { shareLatest } from '@f2020/tools';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { WBCGraph } from '../../model/wbc-graph.model';
import { WBCGraphEntry } from './../../model/wbc-graph.model';

@Component({
  selector: 'f2020-wbc-graph',
  templateUrl: './wbc-graph.component.html',
  styleUrls: ['./wbc-graph.component.scss']
})
export class WbcGraphComponent extends AbstractSuperComponent implements OnInit {

  data: any[];
  activeEntries: any[] = [];
  playerEntris: WBCGraphEntry[];

  constructor(private facade: SeasonFacade, private playerFacade: PlayerFacade) {
    super();
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
      this.takeUntilDestroyed(),
    ).subscribe(([entries, player]) => {
      this.data = entries;
      this.activeEntries = entries.filter(e => e.name === player.displayName);
    });
    graph$.pipe(this.takeUntilDestroyed()).subscribe(players => this.playerEntris = [...players.entries].sort((a, b) => b.points - a.points));
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

import { Component, OnInit } from '@angular/core';
import { SeasonFacade } from '@f2020/api';
import { Player } from '@f2020/data';
import { AbstractSuperComponent } from '@f2020/shared';
import { shareLatest } from '@f2020/tools';
import { map } from 'rxjs/operators';
import { WBCGraph } from '../../model/wbc-graph.model';
import { WBCGraphEntry } from './../../model/wbc-graph.model';

@Component({
  selector: 'f2020-wbc-graph',
  templateUrl: './wbc-graph.component.html',
  styleUrls: ['./wbc-graph.component.scss']
})
export class WbcGraphComponent extends AbstractSuperComponent implements OnInit {

  animations: boolean = true;
  data: any[];
  activeEntries: any[] = [];
  playerEntris: WBCGraphEntry[];

  constructor(private facade: SeasonFacade) {
    super();
  }

  ngOnInit(): void {
    const graph$ = this.facade.season$.pipe(
      map(season => new WBCGraph(season.wbc)),
      shareLatest(),
    );

    graph$.pipe(
      map(data => data.entries.map(e => ({
        name: e.player.displayName,
        series: e.entries
      }))),
      this.takeUntilDestroyed(),
    ).subscribe(entries => this.data = entries);
    graph$.pipe(this.takeUntilDestroyed()).subscribe(players => this.playerEntris = [...players.entries].sort((a, b) => b.points - a.points));
  }

  toggle(player: Player) {
    if (this.activeEntries.some(e => e.name === player.displayName)) {
      this.activeEntries = this.activeEntries.filter(e => e.name !== player.displayName);
    } else {
      this.activeEntries = [...this.activeEntries, this.data.find(d => d.name === player.displayName)];
    }
  }
}

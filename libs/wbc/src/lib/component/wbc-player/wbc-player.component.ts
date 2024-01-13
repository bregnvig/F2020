import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeasonStore } from '@f2020/api';
import { Player, WBCResult } from '@f2020/data';
import { CardPageComponent, FlagURLPipe } from '@f2020/shared';
import { truthy } from '@f2020/tools';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';


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
  styleUrls: ['./wbc-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatToolbarModule, NgIf, CardPageComponent, MatListModule, NgFor, RouterLink, AsyncPipe, FlagURLPipe],
})
export class WbcPlayerComponent implements OnInit {

  races$: Observable<WBCRacePlayer[]>;
  player$: Observable<Player>;

  constructor(private route: ActivatedRoute, private store: SeasonStore) {
  }

  ngOnInit(): void {
    const wbc$ = this.store.season$.pipe(
      truthy(),
      filter(season => !!season.wbc),
      map(season => season.wbc.results),
    );
    this.races$ = wbc$.pipe(
      map(wbc => wbc.map(racePlayer(this.route.snapshot.params.uid))),
    );
    this.player$ = wbc$.pipe(
      map(wbc => wbc.map(w => w.players).flat().find(player => player.player.uid === this.route.snapshot.params.uid)),
      map(wbcPlayer => wbcPlayer.player),
    );
  }

  flagURL(countryCode: string) {
    return `https://www.countryflags.io/${countryCode.toLocaleLowerCase()}/flat/64.png`;
  }
}

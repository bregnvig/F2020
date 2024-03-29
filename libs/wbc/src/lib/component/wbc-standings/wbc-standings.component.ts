import { shareLatest } from '@f2020/tools';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SeasonStore } from '@f2020/api';
import { WBCPlayer } from '@f2020/data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { icon } from '@f2020/shared';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { toObservable } from '@angular/core/rxjs-interop';

const sum = (acc: Map<string, WBCPlayer>, wbcPlayer: WBCPlayer): Map<string, WBCPlayer> => {
  const uid = wbcPlayer.player.uid;
  const updated = acc.get(uid) || { ...wbcPlayer, points: 0 };
  updated.points += wbcPlayer.points;
  return acc.set(uid, updated);
};

@Component({
  templateUrl: './wbc-standings.component.html',
  styleUrls: ['./wbc-standings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatToolbarModule, MatListModule, RouterLink, FontAwesomeModule, MatButtonModule, MatIconModule, AsyncPipe],
})
export class WbcStandingsComponent {

  standings$: Observable<WBCPlayer[]>;
  participants$: Observable<string[]>;
  icon = icon.fasStar;
  chartIcon = icon.farChartLineUpDown;

  constructor(private store: SeasonStore) {

    this.standings$ = toObservable(this.store.season).pipe(
      map(season => season?.wbc?.results || []),
      map(results => Array.from<WBCPlayer>(results.map(r => r.players).flat().reduce(sum, new Map<string, WBCPlayer>()).values())),
      map(players => players.sort((a, b) => b.points - a.points)),
    );
    this.participants$ = toObservable(this.store.season).pipe(
      map(season => season?.wbc?.participants || []),
      shareLatest(),
    );
  }

}

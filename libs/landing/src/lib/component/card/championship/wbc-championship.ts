import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { SeasonStore } from '@f2020/api';
import { IChampionshipPoints, Player, WBCResult } from '@f2020/data';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ChampionshipListComponent } from './championship-list';
import { topEntries } from './championship';

interface WBCStanding extends IChampionshipPoints {
  player: Player;
}

/** Total points of each player, the one with most points first */
const totals = (results: WBCResult[]): { player: Player; points: number }[] =>
  [...results.flatMap(r => r.players).reduce((acc, { player, points }) =>
    acc.set(player.uid, { player, points: (acc.get(player.uid)?.points ?? 0) + points }), new Map<string, { player: Player; points: number }>()).values()]
    .sort((a, b) => b.points - a.points);

/** The standing after all the results, with points and position before the last result */
const wbcStandings = (results: WBCResult[]): WBCStanding[] => {
  const previous = totals(results.slice(0, -1));
  return totals(results).map(({ player, points }, index) => {
    const previousIndex = previous.findIndex(p => p.player.uid === player.uid);
    return {
      player,
      points,
      position: index + 1,
      previousPoints: previousIndex >= 0 ? previous[previousIndex].points : undefined,
      previousPosition: previousIndex >= 0 ? previousIndex + 1 : undefined,
    };
  });
};

@Component({
  selector: 'f2020-wbc-championship',
  template: `
    <mat-card>
      <mat-card-header>
        <fa-icon mat-card-avatar [icon]="icon" size="2x"/>
        <mat-card-title>WBC</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <f2020-championship-list [entries]="entries()"/>
      </mat-card-content>
      <mat-card-actions>
        <a mat-button [routerLink]="['wbc']">SE MERE</a>
      </mat-card-actions>
    </mat-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, FaIconComponent, MatButtonModule, RouterLink, ChampionshipListComponent],
  host: {
    '[hidden]': '!entries().length',
  },
})
export class WbcChampionshipComponent {
  #season = inject(SeasonStore).season;

  protected readonly icon = icon.farRankingStar;
  protected readonly entries = computed(() => topEntries(wbcStandings(this.#season()?.wbc?.results ?? []), ({ player }) => ({
    id: player.uid,
    name: player.displayName,
    image: { url: player.photoURL },
  })));
}

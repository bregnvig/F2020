import { ChangeDetectionStrategy, Component, HostBinding, OnInit } from '@angular/core';
import { PlayerFacade, SeasonFacade } from '@f2020/api';
import { WBCResult } from '@f2020/data';
import { icon } from '@f2020/shared';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, filter, map, tap } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';
import { AsyncPipe, NgIf, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'f2020-previous-race',
  templateUrl: './previous-race.component.html',
  styleUrls: ['./previous-race.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf, MatCardModule, FontAwesomeModule, MatButtonModule, RouterLink, AsyncPipe, NgOptimizedImage],
})
export class PreviousRaceComponent implements OnInit {

  @HostBinding('hidden') isHidden = true;
  wbcResult$: Observable<WBCResult>;
  title$: Observable<string>;
  icon = icon.farTrophy;

  constructor(private facade: SeasonFacade, private playerFacade: PlayerFacade) {
  }

  ngOnInit(): void {
    this.wbcResult$ = this.facade.season$.pipe(
      filter(season => !!(season && season.wbc.results?.length)),
      map(season => season.wbc.results[season.wbc.results.length - 1]),
      filter(result => !!result.players?.length),
      debounceTime(0),
      tap(() => this.isHidden = false),
    );
    this.title$ = combineLatest([
      this.wbcResult$,
      this.playerFacade.player$,
    ]).pipe(
      map(([wbcResult, player]) => {
        const index = wbcResult.players.findIndex(p => p.player.uid === player.uid);
        if (index >= 0 && index <= 2) {
          return `Tillykke med din ${index + 1}. plads!`;
        }
        return `Resultat for ${wbcResult.raceName}`;
      }),
    );
  }
}

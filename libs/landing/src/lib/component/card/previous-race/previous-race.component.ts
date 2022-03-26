import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { PlayerFacade, SeasonFacade } from '@f2020/api';
import { WBCResult } from '@f2020/data';
import { combineLatest, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'f2020-previous-race',
  templateUrl: './previous-race.component.html',
  styleUrls: ['./previous-race.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviousRaceComponent implements OnInit {

  wbcResult$: Observable<WBCResult>;
  title$: Observable<string>;

  constructor(private facade: SeasonFacade, private playerFacade: PlayerFacade) { }

  ngOnInit(): void {
    this.wbcResult$ = this.facade.season$.pipe(
      filter(season => !!(season && season.wbc.results?.length)),
      map(season => season.wbc.results[season.wbc.results.length - 1]),
      filter(result => !!result.players?.length),
    );
    this.title$ = combineLatest([
      this.wbcResult$,
      this.playerFacade.player$
    ]).pipe(
      map(([wbcResult, player]) => {
        const index = wbcResult.players.findIndex(p => p.player.uid === player.uid);
        if (index >= 0 && index <= 2) {
          return `Tillykke med din ${index + 1}. plads!`;
        }
        return `Resultat for ${wbcResult.raceName}`;
      })
    );
  }
}

import { truthy } from '@f2020/tools';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { WBCPlayer, WBCResult, Player } from '@f2020/data';
import { SeasonFacade } from '@f2020/api';
import { map, filter } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';


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
  points: wbc.players.find(p => p.player.uid === uid)?.points ?? 0
});


@Component({
  templateUrl: './wbc-player.component.html',
  styleUrls: ['./wbc-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WbcPlayerComponent implements OnInit {

  races$: Observable<WBCRacePlayer[]>;
  player$: Observable<Player>;

  constructor(private route: ActivatedRoute, private facade: SeasonFacade) { }

  ngOnInit(): void {
    const wbc$ = this.facade.season$.pipe(
      truthy(),
      filter(season => !!season.wbc),
      map(season => season.wbc.results)
    );
    this.races$ = wbc$.pipe(
      map(wbc => wbc.map(racePlayer(this.route.snapshot.params.uid)))
    );
    this.player$ = wbc$.pipe(
      map(wbc => wbc.map(w => w.players).flat().find(player => player.player.uid === this.route.snapshot.params.uid)),
      map(wbcPlayer => wbcPlayer.player)
    );
  }

  flagURL(countryCode: string) {
    return `https://www.countryflags.io/${countryCode.toLocaleLowerCase()}/flat/64.png`
  }
}

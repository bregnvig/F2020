import { Observable, combineLatest } from 'rxjs';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SeasonFacade } from '@f2020/api';
import { ActivatedRoute, Params } from '@angular/router';
import { WBCResult } from '@f2020/data';
import { pluck, map, tap } from 'rxjs/operators';
import { shareLatest } from '@f2020/tools';

@Component({
  selector: 'f2020-wbc-race',
  templateUrl: './wbc-race.component.html',
  styleUrls: ['./wbc-race.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WbcRaceComponent implements OnInit {

  result$: Observable<WBCResult>;

  constructor(private facade: SeasonFacade, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.result$ = combineLatest([
      this.route.params.pipe(pluck<Params, string>('round')),
      this.facade.season$.pipe(map(season => season.wbc))
    ]).pipe(
      map(([round, wbc]) => (wbc?.results || []).find(result => result.round === parseInt(round, 10))),
      shareLatest()
    );
  }
}

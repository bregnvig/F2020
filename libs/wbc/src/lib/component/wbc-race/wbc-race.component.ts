import { Observable, combineLatest } from 'rxjs';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SeasonFacade } from '@f2020/api';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
import { WBCResult } from '@f2020/data';
import { pluck, map, tap } from 'rxjs/operators';
import { shareLatest } from '@f2020/tools';
import { FlagURLPipe } from '../../../../../shared/src/lib/pipe/flag-url.pipe';
import { LoadingComponent } from '../../../../../shared/src/lib/component/loading/loading.component';
import { MatListModule } from '@angular/material/list';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
    selector: 'f2020-wbc-race',
    templateUrl: './wbc-race.component.html',
    styleUrls: ['./wbc-race.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatToolbarModule, NgIf, MatListModule, NgFor, RouterLink, LoadingComponent, AsyncPipe, FlagURLPipe]
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

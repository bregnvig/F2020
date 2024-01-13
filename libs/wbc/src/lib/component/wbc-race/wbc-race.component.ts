import { combineLatest, Observable } from 'rxjs';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { SeasonStore } from '@f2020/api';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
import { WBCResult } from '@f2020/data';
import { map } from 'rxjs/operators';
import { shareLatest } from '@f2020/tools';
import { FlagURLPipe, LoadingComponent } from '@f2020/shared';
import { MatListModule } from '@angular/material/list';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'f2020-wbc-race',
  templateUrl: './wbc-race.component.html',
  styleUrls: ['./wbc-race.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatToolbarModule, NgIf, MatListModule, NgFor, RouterLink, LoadingComponent, AsyncPipe, FlagURLPipe],
})
export class WbcRaceComponent implements OnInit {

  result$: Observable<WBCResult>;

  constructor(private store: SeasonStore, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.result$ = combineLatest([
      this.route.params.pipe(map<Params, string>(params => params.round)),
      this.store.season$.pipe(map(season => season.wbc)),
    ]).pipe(
      map(([round, wbc]) => (wbc?.results || []).find(result => result.round === parseInt(round, 10))),
      shareLatest(),
    );
  }
}

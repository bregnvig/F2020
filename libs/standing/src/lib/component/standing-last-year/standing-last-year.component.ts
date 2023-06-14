import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RacesActions, RacesFacade } from '@f2020/api';
import { RoundResult } from '@f2020/data';
import { Observable } from 'rxjs';
import { FlagURLPipe } from '../../../../../shared/src/lib/pipe/flag-url.pipe';
import { LoadingComponent } from '../../../../../shared/src/lib/component/loading/loading.component';
import { LastYearResultComponent } from './last-year-result.component';
import { LastYearQualifyComponent } from './last-year-qualify.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
    selector: 'f2020-standing-last-year',
    templateUrl: './standing-last-year.component.html',
    styleUrls: ['./standing-last-year.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgIf, MatToolbarModule, MatTabsModule, LastYearQualifyComponent, LastYearResultComponent, LoadingComponent, AsyncPipe, FlagURLPipe]
})
export class StandingLastYearComponent implements OnInit {

  round$: Observable<RoundResult>;

  constructor(private facade: RacesFacade) { }

  ngOnInit(): void {
    this.facade.dispatch(RacesActions.loadLastYear());
    this.round$ = this.facade.lastYear$;
  }
}

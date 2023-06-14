import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { SeasonFacade } from '@f2020/api';
import { IDriverResult, IQualifyResult } from '@f2020/data';
import { icon } from '@f2020/shared';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, combineLatest } from 'rxjs';
import { map, pluck, share, switchMap } from 'rxjs/operators';
import { StandingService } from '../../service/standing.service';
import { DriverNamePipe } from '../../../../../driver/src/lib/pipe/driver-name.pipe';
import { LoadingComponent } from '../../../../../shared/src/lib/component/loading/loading.component';
import { DriverResultComponent } from './driver-result/driver-result.component';
import { DriverQualifyingComponent } from './driver-qualifying/driver-qualifying.component';
import { MatTabsModule } from '@angular/material/tabs';
import { NumberCardComponent } from './number-card/number-card.component';
import { NgIf, AsyncPipe, DecimalPipe } from '@angular/common';
import { CardPageComponent } from '../../../../../shared/src/lib/component/card-page/card-page.component';
import { MatToolbarModule } from '@angular/material/toolbar';

@UntilDestroy()
@Component({
    selector: 'f2020-standing-driver',
    templateUrl: './standing-driver.component.html',
    styleUrls: ['./standing-driver.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatToolbarModule,
        CardPageComponent,
        NgIf,
        NumberCardComponent,
        MatTabsModule,
        DriverQualifyingComponent,
        DriverResultComponent,
        LoadingComponent,
        AsyncPipe,
        DecimalPipe,
        DriverNamePipe,
    ],
})
export class StandingDriverComponent implements OnInit {

  currentSeasonResult$: Observable<IDriverResult>;
  currentSeasonQualifying$: Observable<IQualifyResult[]>;
  previousSeasonResult$: Observable<IDriverResult>;
  previousSeasonQualifying$: Observable<IQualifyResult[]>;
  driverId$: Observable<string>;
  currentYear: number;
  previousYear: number;

  icon = icon;

  constructor(
    private route: ActivatedRoute,
    private service: StandingService,
    private seasonFacade: SeasonFacade) {
  }

  ngOnInit(): void {
    this.driverId$ = this.route.params.pipe(pluck<Params, string>('driverId'));
    this.seasonFacade.season$.pipe(
      map(season => parseInt(season.id, 10)),
      untilDestroyed(this),
    ).subscribe(year => {
      this.currentYear = year;
      this.previousYear = year - 1;
    });
    this.currentSeasonResult$ = combineLatest([
      this.driverId$,
      this.seasonFacade.season$.pipe(map(season => season.id)),
    ]).pipe(
      switchMap(([driverId, seasonId]) => this.service.getDriverResult(seasonId, driverId)),
      share(),
    );
  }

  load(index: number) {
    if (index === 0 && !this.currentSeasonQualifying$) {
      this.currentSeasonQualifying$ = this.driverId$.pipe(
        switchMap(driverId => this.service.getDriverQualify(this.currentYear, driverId)),
      );
    } else if (index === 2 && !this.previousSeasonQualifying$) {
      this.previousSeasonQualifying$ = this.driverId$.pipe(
        switchMap(driverId => this.service.getDriverQualify(this.previousYear, driverId)),
      );
    } else if (index === 3 && !this.previousSeasonResult$) {
      this.previousSeasonResult$ = this.driverId$.pipe(
        switchMap(driverId => this.service.getDriverResult(this.previousYear, driverId)),
      );
    }
  }
}

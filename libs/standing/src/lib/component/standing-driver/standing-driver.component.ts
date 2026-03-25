import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SeasonStore } from '@f2020/api';
import { IDriverResult } from '@f2020/data';
import { CardPageComponent, icon, LoadingComponent } from '@f2020/shared';
import { shareLatest } from '@f2020/tools';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { StandingService } from '../../service/standing.service';
import { DriverPipe } from '@f2020/driver';
import { DriverResultComponent } from './driver-result/driver-result.component';
import { DriverQualifyingComponent } from './driver-qualifying/driver-qualifying.component';
import { MatTabsModule } from '@angular/material/tabs';
import { NumberCardComponent } from './number-card/number-card.component';
import { AsyncPipe, DecimalPipe, NgOptimizedImage } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'f2020-standing-driver',
  templateUrl: './standing-driver.component.html',
  styleUrls: ['./standing-driver.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbarModule,
    CardPageComponent,
    NumberCardComponent,
    MatTabsModule,
    DriverQualifyingComponent,
    DriverResultComponent,
    LoadingComponent,
    AsyncPipe,
    DecimalPipe,
    NgOptimizedImage,
    DriverPipe,
  ],
})
export class StandingDriverComponent {

  currentSeasonResult$: Observable<IDriverResult>;
  previousSeasonResult$: Observable<IDriverResult>;

  driverId$: Observable<string>;

  currentYear: number;
  previousYear: number;

  icon = icon;

  constructor(
    route: ActivatedRoute,
    service: StandingService,
  ) {
    const store = inject(SeasonStore);
    this.driverId$ = route.params.pipe(map(params => params.driverId));
    const currentYear$ = toObservable(store.season).pipe(
      map(season => parseInt(season.id, 10)),
      shareLatest(),
      takeUntilDestroyed(),
    );
    currentYear$.subscribe(year => {
      this.currentYear = year;
      this.previousYear = year - 1;
    });
    this.currentSeasonResult$ = combineLatest([
      this.driverId$,
      currentYear$,
    ]).pipe(
      switchMap(([driverId, currentYear]) => service.getDriverResult(currentYear, currentYear, driverId)),
      shareLatest(),
    );
    this.previousSeasonResult$ = combineLatest([
      this.driverId$,
      currentYear$,
    ]).pipe(
      switchMap(([driverId, currentYear]) => service.getDriverResult(currentYear, currentYear - 1, driverId)),
      shareLatest(),
    );
  }
}

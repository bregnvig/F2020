import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SeasonApiModule } from '@f2020/api';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import * as fromStanding from './+state/standing.reducer';
import { StandingEffects } from './+state/standing.effects';
import { StandingFacade } from './+state/standing.facade';
import { StandingListComponent } from './component/standing-list/standing-list.component';
import { StandingDriverComponent } from './component/standing-driver/standing-driver.component';
import { StandingRoutingModule } from './standing-routing.module';
import { StandingService } from './service/standing.service';
import { StandingActions } from './+state/standing.actions';
import { FlexModule } from '@angular/flex-layout';
import { StandingListItemComponent } from './component/standing-list/standing-list-item/standing-list-item.component';
import { NumberCardComponent } from './component/standing-driver/number-card/number-card.component';
import { DriverResultComponent } from './component/standing-driver/driver-result/driver-result.component';
import { DriverQualifyingComponent } from './component/standing-driver/driver-qualifying/driver-qualifying.component';
import { QualifyingTimesComponent } from './component/standing-driver/driver-qualifying/qualifying-times/qualifying-times.component';
import { DriverModule } from '@f2020/driver';
import { SharedModule } from '@f2020/shared';
import { StandingLastYearComponent } from './component/standing-last-year/standing-last-year.component';
import { LastYearQualifyComponent } from './component/standing-last-year/last-year-qualify.component';
import { LastYearResultComponent } from './component/standing-last-year/last-year-result.component';

const materialModules = [
  MatSnackBarModule,
  MatToolbarModule,
  MatListModule,
  MatTabsModule,
  MatCardModule,
];

@NgModule({
  declarations: [
    StandingListComponent,
    StandingDriverComponent,
    StandingListItemComponent,
    NumberCardComponent,
    DriverResultComponent,
    DriverQualifyingComponent,
    QualifyingTimesComponent,
    StandingLastYearComponent,
    LastYearQualifyComponent,
    LastYearResultComponent,
  ],
  imports: [
    CommonModule,
    StoreModule.forFeature(
      fromStanding.STANDING_FEATURE_KEY,
      fromStanding.reducer,
    ),
    EffectsModule.forFeature([StandingEffects]),
    StandingRoutingModule,
    SeasonApiModule,
    SharedModule,
    FlexModule,
    DriverModule,
    materialModules,
  ],
  providers: [StandingFacade, StandingService],
})
export class StandingModule {

  constructor(facade: StandingFacade) {
    facade.dispatch(StandingActions.loadStandings());
  }
}

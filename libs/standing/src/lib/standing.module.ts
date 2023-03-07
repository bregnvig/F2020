import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SeasonApiModule } from '@f2020/api';
import { DriverModule } from '@f2020/driver';
import { SharedModule } from '@f2020/shared';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StandingActions } from './+state/standing.actions';
import { StandingEffects } from './+state/standing.effects';
import { StandingFacade } from './+state/standing.facade';
import * as fromStanding from './+state/standing.reducer';
import { DriverQualifyingComponent } from './component/standing-driver/driver-qualifying/driver-qualifying.component';
import { QualifyingTimesComponent } from './component/standing-driver/driver-qualifying/qualifying-times/qualifying-times.component';
import { DriverResultComponent } from './component/standing-driver/driver-result/driver-result.component';
import { NumberCardComponent } from './component/standing-driver/number-card/number-card.component';
import { StandingDriverComponent } from './component/standing-driver/standing-driver.component';
import { LastYearQualifyComponent } from './component/standing-last-year/last-year-qualify.component';
import { LastYearResultComponent } from './component/standing-last-year/last-year-result.component';
import { StandingLastYearComponent } from './component/standing-last-year/standing-last-year.component';
import { StandingListItemComponent } from './component/standing-list/standing-list-item/standing-list-item.component';
import { StandingListComponent } from './component/standing-list/standing-list.component';
import { StandingService } from './service/standing.service';
import { StandingRoutingModule } from './standing-routing.module';

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

import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { RaceApiModule } from '@f2020/api';
import { ControlModule } from '@f2020/control';
import { DriverModule } from '@f2020/driver';
import { SharedModule } from '@f2020/shared';
import { BidsComponent } from './component/bids/bids.component';
import { DisplayBidComponent } from './component/display-bid/display-bid.component';
import { DisplayDriversComponent } from './component/display-bid/display-drivers/display-drivers.component';
import { DisplayPlayerBidComponent } from './component/display-bid/display-player-bid/display-player-bid.component';
import { DisplayResultComponent } from './component/display-bid/display-result/display-result.component';
import { EnterBidComponent } from './component/enter-bid/enter-bid.component';
import { PartialBidWarningComponent } from './component/partial-bid-warning/partial-bid-warning.component';
import { RaceDriversComponent } from './component/race-drivers/race-drivers.component';
import { RaceOutletComponent } from './component/race-outlet/race-outlet.component';
import { RaceComponent } from './component/race/race.component';
import { RaceStatusComponent } from './component/races/race-status/race-status.component';
import { RacesComponent } from './component/races/races.component';
import { SubmitInterimResultComponent } from './component/submit-interim-result/submit-interim-result.component';
import { SubmitResultComponent } from './component/submit-result/submit-result.component';
import { RaceRoutingModule } from './race-routing.module';

const MaterialModules = [
  MatCardModule,
  DragDropModule,
  MatAutocompleteModule,
  MatButtonModule,
  MatDialogModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatSnackBarModule,
  MatToolbarModule,
  MatTooltipModule,
  MatExpansionModule,
];

@NgModule({
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    RaceRoutingModule,
    SharedModule,
    GoogleMapsModule,
    ControlModule,
    DriverModule,
    MaterialModules,
    RaceApiModule,
  ],
  declarations: [
    RacesComponent,
    RaceComponent,
    RaceStatusComponent,
    BidsComponent,
    EnterBidComponent,
    SubmitResultComponent,
    SubmitInterimResultComponent,
    DisplayBidComponent,
    PartialBidWarningComponent,
    RaceOutletComponent,
    DisplayDriversComponent,
    RaceDriversComponent,
    DisplayPlayerBidComponent,
    DisplayResultComponent,
  ],
})
export class RaceModule {
}

import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RaceApiModule } from '@f2020/api';
import { ControlModule } from '@f2020/control';
import { DriverModule } from '@f2020/driver';
import { SharedModule } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { BidsComponent } from './component/bids/bids.component';
import { DisplayBidComponent } from './component/display-bid/display-bid.component';
import { DisplayDriversComponent } from './component/display-bid/display-drivers/display-drivers.component';
import { DisplayPlayerBidComponent } from './component/display-bid/display-player-bid/display-player-bid.component';
import { DisplayResultComponent } from './component/display-bid/display-result/display-result.component';
import { EditRaceComponent } from './component/edit-race/edit-race.component';
import { EnterBidComponent } from './component/enter-bid/enter-bid.component';
import { PartialBidWarningComponent } from './component/partial-bid-warning/partial-bid-warning.component';
import { RaceUpdatedWarningComponent } from './component/race';
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
  MatCheckboxModule,
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    RaceRoutingModule,
    SharedModule,
    GoogleMapsModule,
    ControlModule,
    DriverModule,
    MaterialModules,
    NgxMatTimepickerModule,
    RaceApiModule,
  ],
  declarations: [
    RacesComponent,
    RaceComponent,
    RaceUpdatedWarningComponent,
    EditRaceComponent,
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

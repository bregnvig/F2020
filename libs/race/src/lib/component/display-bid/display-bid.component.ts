import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelDescription, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { DriverCodesComponent } from '@f2020/control';
import { Bid, IRace } from '@f2020/data';
import { CardPageComponent, PolePositionTimePipe, TeamNamePipe } from '@f2020/shared';
import { DisplayDriversComponent } from './drivers/display-drivers.component';
import { DriverNamePipe, DriverPipe } from '@f2020/driver';
import { DisplayTeamsComponent } from './teams/display-teams.component';
import { DisplayPoleTimeComponent } from './pole-time/display-pole-time.component';
import {
  DisplaySelectedDriverComponent,
  SelectedDriver
} from './selected-driver/display-selected-driver.component';

@Component({
  selector: 'f2020-display-bid',
  templateUrl: './display-bid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardPageComponent,
    DriverCodesComponent,
    DisplayDriversComponent,
    MatListModule,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelTitle,
    MatExpansionPanelHeader,
    MatExpansionPanelDescription,
    DriverNamePipe,
    TeamNamePipe,
    DisplayTeamsComponent,
    PolePositionTimePipe,
    DriverPipe,
    DisplayPoleTimeComponent,
    DisplaySelectedDriverComponent,
  ],
})
export class DisplayBidComponent {
  bid = input.required<Partial<Bid>>();
  race = input.required<IRace>();
  bidToCompare = input<Partial<Bid>>();

  constructor() {
    effect(() => console.log('Bid', this.bid()));
  }
  
  getDriverStartPosition(): SelectedDriver {
    const driverStartPosition: SelectedDriver = {
      grid: this.bid().selectedDriver.grid,
      gridPoints: this.bid().selectedDriver.gridPoints,
      finish: this.bid().selectedDriver.finish,
      finishPoints: this.bid().selectedDriver.finishPoints,
    };

    if (this.bidToCompare()) {
      driverStartPosition.compareGrid = this.bidToCompare().selectedDriver.grid;
      driverStartPosition.compareGridPoints = this.bidToCompare().selectedDriver.gridPoints;
      driverStartPosition.compareFinish = this.bidToCompare().selectedDriver.finish;
      driverStartPosition.compareFinishPoints = this.bidToCompare().selectedDriver.finishPoints;
    }

    return driverStartPosition;
  }
}

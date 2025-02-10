import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelDescription, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { DriverCodesComponent } from '@f2020/control';
import { Bid, IRace } from '@f2020/data';
import { DriverNamePipe } from '@f2020/driver';
import { CardPageComponent, PolePositionTimePipe, TeamNamePipe } from '@f2020/shared';
import { DisplayDriversComponent } from './drivers/display-drivers.component';
import { DisplayTeamsComponent } from './teams/display-teams.component';

@Component({
  selector: 'f2020-display-bid',
  templateUrl: './display-bid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardPageComponent,
    DriverCodesComponent,
    DisplayDriversComponent,
    MatListModule,
    DisplayTeamsComponent,
    PolePositionTimePipe,
    TeamNamePipe,
    DriverNamePipe,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelTitle,
    MatExpansionPanelHeader,
    MatExpansionPanelDescription],
})
export class DisplayBidComponent {

  bid = input.required<Partial<Bid>>();
  race = input.required<IRace>();
}

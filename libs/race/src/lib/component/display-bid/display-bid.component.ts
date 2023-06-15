import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
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
  styleUrls: ['./display-bid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CardPageComponent, MatExpansionModule, NgIf, DriverCodesComponent, DisplayDriversComponent, MatListModule, NgFor, DisplayTeamsComponent, PolePositionTimePipe, TeamNamePipe, DriverNamePipe]
})
export class DisplayBidComponent {

  @Input() bid: Partial<Bid>;
  @Input() race: IRace;
}

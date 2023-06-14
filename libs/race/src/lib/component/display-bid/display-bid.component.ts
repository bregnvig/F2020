import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Bid, IRace } from '@f2020/data';
import { DriverNamePipe } from '../../../../../driver/src/lib/pipe/driver-name.pipe';
import { TeamNamePipe } from '../../../../../shared/src/lib/pipe/team-name.pipe';
import { PolePositionTimePipe } from '../../../../../shared/src/lib/pipe/pole-position-time.pipe';
import { DisplayTeamsComponent } from './teams/display-teams.component';
import { MatListModule } from '@angular/material/list';
import { DisplayDriversComponent } from './drivers/display-drivers.component';
import { DriverCodesComponent } from '../../../../../control/src/lib/components/driver-codes/driver-codes.component';
import { NgIf, NgFor } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { CardPageComponent } from '../../../../../shared/src/lib/component/card-page/card-page.component';

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

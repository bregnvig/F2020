import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { icon, LoadingComponent } from '@f2020/shared';
import { DisplayBidComponent } from '../display-bid.component';
import { MatListModule } from '@angular/material/list';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RaceStore } from '@f2020/api';

@Component({
  selector: 'f2020-display-result',
  templateUrl: './display-result.component.html',
  styleUrls: ['./display-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, FontAwesomeModule, MatListModule, DisplayBidComponent, LoadingComponent],
})
export class DisplayResultComponent {

  race = inject(RaceStore).race;
  icon = icon.fasFlagCheckered;


}

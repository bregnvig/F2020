import { ChangeDetectionStrategy, Component } from '@angular/core';
import { icon, LoadingComponent } from '@f2020/shared';
import { DisplayBidComponent } from '../display-bid.component';
import { MatListModule } from '@angular/material/list';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AsyncPipe, NgIf } from '@angular/common';
import { RaceStore } from '@f2020/api';

@Component({
  selector: 'f2020-display-result',
  templateUrl: './display-result.component.html',
  styleUrls: ['./display-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf, MatToolbarModule, FontAwesomeModule, MatListModule, DisplayBidComponent, LoadingComponent, AsyncPipe],
})
export class DisplayResultComponent {

  race = this.store.race;
  icon = icon.fasFlagCheckered;

  constructor(private store: RaceStore) {
  }

}

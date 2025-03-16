import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RaceStore } from '@f2020/api';
import { icon, LoadingComponent } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DisplayBidComponent } from '../display-bid.component';

@Component({
  selector: 'f2020-display-result',
  template: `
    @if (race()) {
      <mat-toolbar color="primary">
        <fa-icon matListItemIcon class="text-white" [icon]="icon" size="2x"></fa-icon>
        <span class="ml-2" matListItemTitle>Resultat {{ race().name }}</span>
      </mat-toolbar>
      <div class="py-3">
        <f2020-display-bid [bid]="race().result" [race]="race()"></f2020-display-bid>
      </div>
    } @else {
      <sha-loading></sha-loading>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, FaIconComponent, MatListModule, DisplayBidComponent, LoadingComponent],
})
export class DisplayResultComponent {

  race = inject(RaceStore).race;
  icon = icon.fasFlagCheckered;


}

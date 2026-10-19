import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { IDriver, IRace } from '@f2020/data';
import { DateTimePipe } from '@f2020/shared';
import { LivePositionsComponent } from './positions/live-positions.component';

@Component({
  selector: 'f2020-live-positions-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <mat-card class="h-full">
      <mat-card-header>
        <mat-card-title>Løbspositioner</mat-card-title>
        <mat-card-subtitle>Sidst opdateret {{ positions.latestUpdate() | dateTime: 'HH:mm.ss' }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <f2020-live-positions #positions class="block mt-3" [race]="race()" [drivers]="drivers()" />
      </mat-card-content>
    </mat-card>
  `,
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, DateTimePipe, LivePositionsComponent],
})
export class LivePositionsCardComponent {
  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();
}

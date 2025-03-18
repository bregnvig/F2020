import { Component, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { LiveRadioComponent } from './live-radio.component';
import { Bid, IDriver, IRace } from '@f2020/data';
import { LiveRaceComponent } from './live-race.component';

@Component({
  selector: 'f2020-live-live',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>
          @if (isLiveLive()) {
            Live live
          } @else {
            Relive
          }
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <f2020-live-race [race]="race()" [bids]="bids()" [drivers]="drivers()"/>
        <f2020-live-radio class="block mt-3" [race]="race()" [drivers]="drivers()"/>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button (click)="cancel()">@if (isLiveLive()) {
          Stop
        } @else {
          Tilbage til resultat
        }</button>
      </mat-card-actions>
    </mat-card>
  `,
  standalone: true,
  imports: [
    MatButton,
    MatCard,
    MatCardActions,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    LiveRadioComponent,
    LiveRaceComponent,
  ],
})

export class LiveLiveComponent {
  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();
  bids = input.required<Bid[]>();
  isLiveLive = input.required<boolean>();
  stopped = output<boolean>();

  cancel() {
    this.stopped.emit(true);
  }
}

import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { IDriver, IRace } from '@f2020/data';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LiveTrackDriversComponent } from './track/live-track-drivers';
import { LiveTrackDriversData, LiveTrackDriversDialogComponent } from './track/live-track-drivers-dialog';
import { injectOpenFullscreen } from './track/open-fullscreen';
import { TrackLapComponent } from './track/track-lap';

/** The cars on the track */
@Component({
  selector: 'f2020-live-track-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <mat-card class="h-full">
      <mat-card-header>
        <mat-card-title><f2020-track-lap [race]="race()" emptyText="Banen" /></mat-card-title>
        <button mat-icon-button class="ms-auto" aria-label="Vis banen i fuld skærm" (click)="openDriversTrack()">
          <fa-icon [icon]="icons.farExpand" />
        </button>
      </mat-card-header>
      <mat-card-content>
        <f2020-live-track-drivers class="block mt-3 aspect-square max-h-[70vh] mx-auto" [race]="race()" [drivers]="drivers()" [showLap]="false" />
      </mat-card-content>
    </mat-card>
  `,
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatIconButton, FaIconComponent, LiveTrackDriversComponent, TrackLapComponent],
})
export class LiveTrackCardComponent {
  #openFullscreen = injectOpenFullscreen();

  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();
  relive = input(false, { transform: booleanAttribute });

  protected readonly icons = icon;

  protected openDriversTrack() {
    this.#openFullscreen<LiveTrackDriversDialogComponent, LiveTrackDriversData>(LiveTrackDriversDialogComponent, {
      race: this.race(),
      drivers: this.drivers(),
      relive: this.relive(),
    });
  }
}

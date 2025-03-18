import { Component, inject, input } from '@angular/core';
import { DateTimePipe, icon } from '@f2020/shared';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatList, MatListItem, MatListItemAvatar, MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { rxResource } from '@angular/core/rxjs-interop';
import { RacesService } from '@f2020/api';
import { IDriver, IRace } from '@f2020/data';

@Component({
  selector: 'f2020-live-radio',
  template: `
    @if (messages.value(); as messages) {
      <h2>Hold beskeder</h2>
      <mat-list>
        @for (message of messages; track message.metaId) {
          <mat-list-item>
            <img matListItemAvatar height="40" width="40" [ngSrc]="message.driver.headshotUrl" [alt]="message.driver.name">
            <h4 matListItemTitle>
              <span>{{ message.driver.name }}</span>
              <span class="float-right mt-5 flex items-center">
                  @if (audio.duration; as duration) {
                    <span class="text-xs">{{ duration | number: '1.2-2' }}s</span>
                  }
                <button (click)="audio.paused ? audio.play() : audio.pause()">
                    <fa-icon size="2x" [icon]="audio.paused ? play : pause" [fixedWidth]="true"></fa-icon>
                  </button>
                </span>
            </h4>
            <div matListItemLine>
              <audio #audio (ended)="audio.pause()">
                <source [src]="message.recordingUrl" type="audio/mpeg">
                Hov - du kan ikke afspille denne besked
              </audio>
              <span class="text-xs">&#64;{{ message.date | dateTime: 'HH:mm.ss' }}</span>
            </div>
          </mat-list-item>
        }
      </mat-list>
    }
  `,
  imports: [
    DateTimePipe,
    DecimalPipe,
    FaIconComponent,
    MatList,
    MatListItem,
    MatListItemAvatar,
    MatListItemLine,
    MatListItemTitle,
    NgOptimizedImage,
  ],
})

export class LiveRadioComponent {
  #service = inject(RacesService);
  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();

  play = icon.farPlay;
  pause = icon.farPause;

  messages = rxResource({
    request: () => ({ drivers: this.drivers(), race: this.race() }),
    loader: ({ request }) => this.#service.getLiveRadio(request.race, request.drivers),
  });
}

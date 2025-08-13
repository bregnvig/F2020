import { Component, inject, input } from '@angular/core';
import { DateTimePipe } from '@f2020/shared';
import { NgOptimizedImage } from '@angular/common';
import { MatList, MatListItem, MatListItemAvatar, MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { rxResource } from '@angular/core/rxjs-interop';
import { LiveResultService } from '@f2020/api';
import { IDriver, IRace } from '@f2020/data';
import { RadioMessageComponent } from './radio-message.component';

@Component({
  selector: 'f2020-live-radio',
  template: `
    @if (messages.value(); as messages) {
      <mat-list>
        @for (message of messages; track $index) {
          <mat-list-item>
            <img matListItemAvatar height="40" width="40" [ngSrc]="message.driver.headshotUrl" [alt]="message.driver.name">
            <h4 matListItemTitle>
              <span>{{ message.driver.name }}</span>
              <f2020-radio-message [url]="message.recordingUrl"/>
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
    MatList,
    MatListItem,
    MatListItemAvatar,
    MatListItemLine,
    MatListItemTitle,
    NgOptimizedImage,
    RadioMessageComponent,
  ],
})

export class LiveRadioComponent {
  #live = inject(LiveResultService);
  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();

  messages = rxResource({
    request: () => ({ drivers: this.drivers(), race: this.race() }),
    loader: ({ request }) => this.#live.getRadio(request.race, request.drivers),
  });
}

import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatList, MatListItem, MatListItemAvatar, MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { RaceControl } from '@f2020/data';
import { DateTimePipe, DriverHeadshotComponent } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { raceControlIcon } from './race-control-icon';

/** All the race control messages so far, newest first. It follows the race while it is open */
@Component({
  selector: 'f2020-race-control-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- The sheet scrolls itself, as it is at most 80% of the screen -->
    <mat-list>
      @for (message of messages(); track $index) {
        <mat-list-item class="!h-auto !py-2">
          @if (message.driver) {
            <sha-driver-headshot matListItemAvatar [driver]="message.driver" />
          } @else {
            <div matListItemAvatar class="!flex items-center justify-center !bg-orange-500 !text-white">
              <fa-icon [icon]="icon(message.category)" />
            </div>
          }
          <span matListItemTitle class="!whitespace-normal">{{ message.message }}</span>
          <span matListItemLine>
            {{ message.date | dateTime: 'HH:mm:ss' }}
            @if (message.lapNumber) {
              · Omgang {{ message.lapNumber }}
            }
          </span>
        </mat-list-item>
      } @empty {
        <mat-list-item>Ingen beskeder endnu</mat-list-item>
      }
    </mat-list>
  `,
  imports: [MatList, MatListItem, MatListItemAvatar, MatListItemTitle, MatListItemLine, DriverHeadshotComponent, FaIconComponent, DateTimePipe],
})
export class RaceControlSheetComponent {
  #data = inject<Signal<RaceControl[]>>(MAT_BOTTOM_SHEET_DATA);

  protected readonly messages = computed(() => this.#data().toSorted((a, b) => b.date.toMillis() - a.date.toMillis()));
  protected readonly icon = raceControlIcon;
}

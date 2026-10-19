import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatList, MatListItem, MatListItemAvatar, MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { IDriverSector, ILiveDriverQualifying, ILiveQualifyResult } from '@f2020/data';
import { AnimatedForDirective, DriverHeadshotComponent, PolePositionTimePipe } from '@f2020/shared';
import { LiveSectorStatusComponent } from '../positions/sector/live-sector-status.component';

@Component({
  selector: 'f2020-live-qualify-drivers',
  template: `
    @if (results().length) {
      <mat-list>
        <mat-list-item *shaAnimatedFor="let result of results(); key: driverKey" [class.opacity-50]="result.knockedOutIn">
          <sha-driver-headshot matListItemAvatar [driver]="result.driver" placeholder="assets/loading/red.svg" />
          <!-- The layout is on an inline span inside, as Material styles the title and the line itself -->
          <div matListItemTitle>
            <span class="inline-flex w-full flex-row justify-between gap-2">
              <span>{{ result.position }}. {{ result.driver.name }}</span>
              <span class="tabular-nums">{{ result.duration | polePositionTime }}</span>
            </span>
          </div>
          <div matListItemLine>
            <span class="inline-flex w-full flex-row justify-between gap-2 text-xs">
              @if (result.knockedOutIn; as phase) {
                <span>Ude i Q{{ phase }}</span>
              } @else {
                <f2020-live-sector-status [status]="sectors()?.get(result.driver.driverId)" />
              }
              <span class="tabular-nums">{{ gap(result) }}</span>
            </span>
          </div>
        </mat-list-item>
      </mat-list>
    } @else {
      Venter på kvalifikationen...
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AnimatedForDirective,
    MatList,
    MatListItem,
    MatListItemAvatar,
    MatListItemTitle,
    MatListItemLine,
    DriverHeadshotComponent,
    PolePositionTimePipe,
    LiveSectorStatusComponent,
  ],
})
export class LiveQualifyDriversComponent {
  result = input.required<ILiveQualifyResult | undefined>();
  /** The sectors of the lap each driver is on, by driver id */
  sectors = input<Map<string, IDriverSector>>();

  protected readonly results = computed(() => this.result()?.results ?? []);
  protected readonly driverKey = (result: ILiveDriverQualifying) => result.driver.driverId;

  protected gap(result: ILiveDriverQualifying): string {
    return result.gap ? `+${(result.gap / 1000).toFixed(3)}` : '';
  }
}

import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { MatList, MatListItem, MatListItemAvatar, MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { IDriverSector, ILiveDriverQualifying, ILiveQualifyResult } from '@f2020/data';
import { DriverHeadshotComponent, PolePositionTimePipe } from '@f2020/shared';
import { LiveSectorStatusComponent } from '../positions/sector/live-sector-status.component';

@Component({
  selector: 'f2020-live-qualify-drivers',
  template: `
    <mat-list>
      @for (entry of entries(); track entry.result.driver.driverId) {
        <mat-list-item [style.transform]="'translateY(' + entry.offset * 100 + '%)'" [class.opacity-50]="entry.result.knockedOutIn">
          <sha-driver-headshot matListItemAvatar [driver]="entry.result.driver" placeholder="assets/loading/red.svg" />
          <!-- The layout is on an inline span inside, as Material styles the title and the line itself -->
          <div matListItemTitle>
            <span class="inline-flex w-full flex-row justify-between gap-2">
              <span>{{ entry.result.position }}. {{ entry.result.driver.name }}</span>
              <span class="tabular-nums">{{ entry.result.duration | polePositionTime }}</span>
            </span>
          </div>
          <div matListItemLine>
            <span class="inline-flex w-full flex-row justify-between gap-2 text-xs">
              @if (entry.result.knockedOutIn; as phase) {
                <span>Ude i Q{{ phase }}</span>
              } @else {
                <f2020-live-sector-status [status]="sectors()?.get(entry.result.driver.driverId)" />
              }
              <span class="tabular-nums">{{ gap(entry.result) }}</span>
            </span>
          </div>
        </mat-list-item>
      } @empty {
        Venter på kvalifikationen...
      }
    </mat-list>
  `,
  styles: `
    mat-list-item {
      transition: all 1s;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatList, MatListItem, MatListItemAvatar, MatListItemTitle, MatListItemLine, DriverHeadshotComponent, PolePositionTimePipe, LiveSectorStatusComponent],
})
export class LiveQualifyDriversComponent {
  result = input.required<ILiveQualifyResult | undefined>();
  /** The sectors of the lap each driver is on, by driver id */
  sectors = input<Map<string, IDriverSector>>();

  /** The drivers stay in the first order, and are moved to their position, so they slide into place */
  #initial = linkedSignal<ILiveDriverQualifying[], string[]>({
    source: () => this.result()?.results ?? [],
    computation: (results, previous) => {
      const known = previous?.value ?? [];
      return [...known, ...results.map(result => result.driver.driverId).filter(driverId => !known.includes(driverId))];
    },
  });

  protected readonly entries = computed(() => {
    const results = this.result()?.results ?? [];
    const current = new Map(results.map((result, index) => [result.driver.driverId, { result, index }]));
    return this.#initial()
      .filter(driverId => current.has(driverId))
      .map((driverId, index) => {
        const { result, index: currentIndex } = current.get(driverId)!;
        return { result, offset: currentIndex - index };
      });
  });

  protected gap(result: ILiveDriverQualifying): string {
    return result.gap ? `+${(result.gap / 1000).toFixed(3)}` : '';
  }
}

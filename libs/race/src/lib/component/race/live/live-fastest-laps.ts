import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatList, MatListItem } from '@angular/material/list';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { RaceResultProvider } from '@f2020/api';
import { IDriver, IDriverLapTime, IRace } from '@f2020/data';
import { AnimatedForDirective, DriverHeadshotComponent, PolePositionTimePipe } from '@f2020/shared';
import { valueOf } from './track/car-progress';

/** The best laps shown */
const shown = 10;

@Component({
  selector: 'f2020-live-fastest-laps',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <mat-card class="h-full">
      <mat-card-header>
        <mat-card-title>Hurtigste omgange</mat-card-title>
      </mat-card-header>
      <mat-card-content class="!pt-3">
        @if (laps().length) {
          <mat-list>
            <mat-list-item *shaAnimatedFor="let lap of laps(); key: lapKey; let index = index">
              <span class="flex items-center gap-4">
                <sha-driver-headshot [driver]="lap.driver" placeholder="assets/loading/red.svg" />
                <span class="flex-1 min-w-0">
                  <span class="block truncate">{{ lap.driver.name }}</span>
                  <span class="block text-xs opacity-70">Omgang {{ lap.lap }}</span>
                </span>
                <span class="text-right tabular-nums">
                  <span class="block" [class.text-fuchsia-400]="index === 0">{{ lap.time * 1000 | polePositionTime }}</span>
                  @if (index > 0) {
                    <span class="block text-xs opacity-70">+{{ (lap.time - fastest()).toFixed(3) }}</span>
                  }
                </span>
              </span>
            </mat-list-item>
          </mat-list>
        } @else if (fastestLaps.error()) {
          <p>Omgangstiderne kunne ikke hentes</p>
        } @else {
          <p>Venter på den første omgang...</p>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    mat-list {
      --mat-list-list-item-one-line-container-height: 64px;
    }
  `,
  imports: [AnimatedForDirective, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatList, MatListItem, DriverHeadshotComponent, PolePositionTimePipe],
})
export class LiveFastestLapsComponent {
  #live = inject(RaceResultProvider);

  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();

  protected readonly fastestLaps = rxResource({
    params: () => ({ race: this.race(), drivers: this.drivers() }),
    stream: ({ params }) => this.#live.getFastestLaps(params.race, params.drivers),
  });

  #value = valueOf(this.fastestLaps);
  protected readonly laps = computed(() => this.#value()?.laps.slice(0, shown) ?? []);
  protected readonly lapKey = (lap: IDriverLapTime) => lap.driver.driverId;
  protected readonly fastest = computed(() => this.laps()[0]?.time ?? 0);
}

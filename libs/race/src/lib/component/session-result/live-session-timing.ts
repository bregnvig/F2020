import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatListModule } from '@angular/material/list';
import { OpenF1WSSService, SessionTimingService } from '@f2020/api';
import { IDriverSector, ILiveSessionDriver, IRace, IRaceSession, isRaceSession } from '@f2020/data';
import { AnimatedForDirective, DateTimePipe, DriverHeadshotComponent, PolePositionTimePipe } from '@f2020/shared';
import { map } from 'rxjs';
import { LiveSectorStatusComponent } from '../race/live/positions/sector/live-sector-status.component';
import { tyres, unknownTyre } from '../race/live/tyres';

interface TimingRow extends Omit<ILiveSessionDriver, 'gap' | 'tyre'> {
  /** The best lap, or the last lap in the sprint and the race */
  time?: number;
  gap: string;
  tyre?: (typeof tyres)[keyof typeof tyres];
  sectors?: IDriverSector;
  /** A line is only shown when it has something, e.g. not before OpenF1 has the laps */
  details: boolean;
  lines: number;
}

const gap = (milliseconds: number) => `+${(milliseconds / 1000).toFixed(3)}`;

/** The times of a session while it is driven, updated live */
@Component({
  selector: 'f2020-live-session-timing',
  template: `
    @if (latestUpdate(); as latestUpdate) {
      <p class="mt-2 mb-0 text-xs opacity-70">Opdateret {{ latestUpdate | dateTime: 'HH:mm:ss' }}</p>
    }
    @if (rows().length) {
      @if (noTimes()) {
        <p class="mt-1 mb-0 text-xs opacity-70">Ingen omgangstider endnu</p>
      }
      <mat-list>
        <mat-list-item *shaAnimatedFor="let row of rows(); key: driverKey" [lines]="row.lines">
          <sha-driver-headshot matListItemAvatar [driver]="row.driver" placeholder="assets/loading/red.svg" />
          <div matListItemTitle>
            <span class="inline-flex w-full flex-row justify-between gap-2">
              <span>{{ row.position }}. {{ row.driver.name }}</span>
              @for (time of [row.time]; track time) {
                <span class="new-time rounded px-1 tabular-nums" [class.text-purple-400]="row.fastest" [class.font-bold]="row.fastest">{{ time | polePositionTime }}</span>
              }
            </span>
          </div>
          @if (row.details) {
            <div matListItemLine>
              <span class="inline-flex w-full flex-row justify-between gap-2 text-xs">
                <span>
                  @if (row.tyre; as tyre) {
                    <span class="font-bold" [class]="tyre.text" [title]="tyre.name">{{ tyre.letter }}</span>
                    <span class="opacity-70">{{ row.tyreAge }} omg.{{ row.lap ? ' ·' : '' }}</span>
                  }
                  @if (row.lap) {
                    <span class="opacity-70">Omgang {{ row.lap }}</span>
                  }
                </span>
                <span class="tabular-nums">{{ row.gap }}</span>
              </span>
            </div>
          }
          @if (row.sectors; as sectors) {
            <div matListItemLine>
              <f2020-live-sector-status class="text-xs" [status]="sectors" />
            </div>
          }
        </mat-list-item>
      </mat-list>
    } @else {
      <p class="mt-4">Venter på de første tider...</p>
    }
  `,
  styles: `
    .new-time {
      animation: new-time 2s ease-out;
    }

    @keyframes new-time {
      from {
        background-color: rgb(34 197 94 / 0.5);
      }
      to {
        background-color: transparent;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .new-time {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, AnimatedForDirective, DriverHeadshotComponent, LiveSectorStatusComponent, DateTimePipe, PolePositionTimePipe],
  providers: [SessionTimingService, OpenF1WSSService],
})
export class LiveSessionTimingComponent {
  #service = inject(SessionTimingService);

  readonly race = input.required<IRace>();
  readonly session = input.required<IRaceSession>();

  #timing = rxResource({
    params: () => ({ race: this.race(), session: this.session() }),
    stream: ({ params }) => this.#service.getTiming(params.race, params.session),
  });
  #sectorList = rxResource({
    params: () => ({ race: this.race(), session: this.session() }),
    stream: ({ params }) => this.#service.getSectors(params.race, params.session),
  });

  protected readonly latestUpdate = toSignal(this.#service.status.pipe(map(status => status.latestUpdate)));
  protected readonly sectors = computed(() => new Map((this.#sectorList.value() ?? []).map((sector: IDriverSector) => [sector.driver.driverId, sector])));
  protected readonly rows = computed((): TimingRow[] => {
    const byPosition = isRaceSession(this.session());
    return (this.#timing.value() ?? []).map(row => {
      const tyre = row.tyre ? (tyres[row.tyre] ?? unknownTyre) : undefined;
      const rowGap = row.lapsBehind ?? (row.gap ? gap(row.gap) : '');
      const sectors = this.sectors().get(row.driver.driverId);
      const details = !!tyre || !!row.lap || !!rowGap;
      return {
        ...row,
        // The sprint and the race show the last lap, as they are ordered by position. The other sessions show the best lap
        time: byPosition ? row.lastLap : row.bestLap,
        gap: rowGap,
        tyre,
        sectors,
        details,
        lines: 1 + Number(details) + Number(!!sectors),
      };
    });
  });
  protected readonly noTimes = computed(() => this.rows().every(row => !row.time));
  protected readonly driverKey = (row: TimingRow) => row.driver.driverId;
}

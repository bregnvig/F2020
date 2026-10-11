import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RaceResultProvider } from '@f2020/api';
import { IRace } from '@f2020/data';

/** The lap of the leader and the laps of the race. The laps of each circuit are written to assets/tracks by the builder */
@Component({
  selector: 'f2020-track-lap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The font is set, as the page's is Times New Roman and Material only sets Roboto on its own components
  host: { style: 'font-family: Roboto, sans-serif' },
  template: `
    @if (lap() && laps(); as laps) {
      Omgang {{ lap() }} af {{ laps }}
    } @else {
      {{ emptyText() }}
    }
  `,
})
export class TrackLapComponent {
  race = input.required<IRace>();
  /** Shown before the race has started */
  emptyText = input('');

  #live = inject(RaceResultProvider);
  #circuitLaps = httpResource<Record<string, number>>(() => 'assets/tracks/laps.json');

  protected readonly laps = computed(() => {
    const circuitId = this.race().circuitId;
    // A failed resource throws when its value is read
    return circuitId != null && this.#circuitLaps.hasValue() ? this.#circuitLaps.value()[circuitId] : undefined;
  });
  /** The leader is on the last lap after crossing the line at the end of it */
  protected readonly lap = computed(() => Math.min(this.#lap(), this.laps() ?? Number.MAX_SAFE_INTEGER));
  #lap = toSignal(this.#live.currentLap, { initialValue: 0 });
}

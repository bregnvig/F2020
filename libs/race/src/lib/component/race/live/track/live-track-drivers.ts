import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RaceResultProvider, TrackService } from '@f2020/api';
import { IDriver, IRace, isStationary, progressAt } from '@f2020/data';
import { animationFrame } from './animation-frame';
import { carProgress } from './car-progress';
import { TrackLapComponent } from './track-lap';
import { TrackMapComponent, TrackMarker } from './track-map';

/** The cars on the track, from OpenF1's locations */
@Component({
  selector: 'f2020-live-track-drivers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showLap()) {
      <f2020-track-lap class="absolute top-0 left-0 text-sm font-medium" [race]="race()" />
    }
    @if (track.hasValue()) {
      <f2020-track-map class="block w-full h-full" [track]="track.value()" [markers]="markers()" />
    } @else if (track.error()) {
      <p>Banen kunne ikke hentes</p>
    } @else {
      <p>Henter banen...</p>
    }
  `,
  imports: [TrackMapComponent, TrackLapComponent],
  host: { class: 'relative', style: 'font-family: Roboto, sans-serif' },
})
export class LiveTrackDriversComponent {
  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();
  /** The card has the lap in its title instead */
  showLap = input(true, { transform: booleanAttribute });

  #live = inject(RaceResultProvider);
  #trackService = inject(TrackService);
  #frame = animationFrame();

  protected readonly track = rxResource({
    params: () => this.race(),
    stream: ({ params }) => this.#trackService.getTrack(params),
  });

  #playback = rxResource({
    params: () => ({ race: this.race(), drivers: this.drivers() }),
    stream: ({ params }) => this.#live.getLocationPlayback(params.race, params.drivers),
  });

  #cars = carProgress(this.track.value, this.#playback.value);

  #result = rxResource({
    params: () => ({ race: this.race(), drivers: this.drivers() }),
    stream: ({ params }) => this.#live.getResult(params.race, params.drivers),
  });

  /**
   * The drivers out of the race. The result takes a driver who is two laps behind as out, so a car is only left out
   * when it has stopped as well
   */
  #retired = computed(() => new Set(this.#result.value()?.result.results.filter(({ status }) => status === 'DNF').map(({ driver }) => driver.driverId)));

  /** Worked out for every frame, at the time the playback gives */
  protected readonly markers = computed<TrackMarker[]>(() => {
    this.#frame();
    const now = this.#playback.value()?.now();
    const retired = this.#retired();
    return now === undefined ? [] : this.#cars().flatMap(({ driver, samples, locations }) => {
      const progress = progressAt(samples, now);
      return progress === undefined || (retired.has(driver.driverId) && isStationary(locations, now)) ? [] : [{
        id: driver.driverId,
        progress,
        label: driver.code,
        color: driver.teamColor ? `#${driver.teamColor}` : undefined,
      }];
    });
  });
}

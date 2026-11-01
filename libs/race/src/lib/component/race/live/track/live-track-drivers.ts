import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RaceResultProvider, TrackService } from '@f2020/api';
import { IDriver, IRace, progressAt } from '@f2020/data';
import { animationFrame } from './animation-frame';
import { carProgress, carsInPitLane, valueOf } from './car-progress';
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
  host: { class: 'relative' },
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

  #playbackValue = valueOf(this.#playback);
  #cars = carProgress(valueOf(this.track), this.#playbackValue);

  /** Worked out for every frame, at the time the playback gives */
  protected readonly markers = computed<TrackMarker[]>(() => {
    const frame = this.#frame();
    const now = this.#playbackValue()?.now();
    if (now === undefined) return [];
    const cars = this.#cars();
    const retired = this.#live.retiredCars;
    retired.update(
      cars.map(({ driver, locations }) => ({ id: driver.driverId, locations })),
      now,
      frame,
    );
    const inPitLane = carsInPitLane(cars, now);
    return cars.flatMap(({ driver, samples }) => {
      const progress = progressAt(samples, now);
      const retiring = retired.retiring(driver.driverId, now, frame);
      return progress === undefined || (retiring !== undefined && retiring >= 1)
        ? []
        : [
            {
              id: driver.driverId,
              progress,
              label: driver.code,
              color: driver.teamColor ? `#${driver.teamColor}` : undefined,
              retiring,
              pit: inPitLane.has(driver.driverId),
            },
          ];
    });
  });
}

import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RaceResultProvider, TrackService } from '@f2020/api';
import { IDriver, IRace, isStationary, progressAt } from '@f2020/data';
import { animationFrame } from './animation-frame';
import { carProgress, valueOf } from './car-progress';
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

  #playbackValue = valueOf(this.#playback);
  #cars = carProgress(valueOf(this.track), this.#playbackValue);

  /**
   * When each car was found out of the race. It stays out whatever the locations say after that, as a car that has retired
   * can show up again for a moment. Moving the relive back to before it shows it again
   */
  #retiredAt = new Map<string, number>();

  /** Worked out for every frame, at the time the playback gives */
  protected readonly markers = computed<TrackMarker[]>(() => {
    this.#frame();
    const now = this.#playbackValue()?.now();
    if (now === undefined) return [];
    const cars = this.#cars();
    // A car that has stopped while most of the others drive is out of the race. On the grid or under a red flag most have stopped
    const stopped = cars.filter(({ locations }) => isStationary(locations, now)).map(({ driver }) => driver.driverId);
    if (stopped.length < cars.length / 2) {
      // The earliest time it was found, as the relive can be moved back to before it was first seen
      stopped.forEach(driverId => now < (this.#retiredAt.get(driverId) ?? Number.MAX_VALUE) && this.#retiredAt.set(driverId, now));
    }
    const retired = (driverId: string) => (this.#retiredAt.get(driverId) ?? Number.MAX_VALUE) <= now;
    return cars.flatMap(({ driver, samples }) => {
      const progress = progressAt(samples, now);
      return progress === undefined || retired(driver.driverId) ? [] : [{
        id: driver.driverId,
        progress,
        label: driver.code,
        color: driver.teamColor ? `#${driver.teamColor}` : undefined,
      }];
    });
  });
}

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RaceResultProvider, TrackService } from '@f2020/api';
import { IDriver, IRace, trackProgress } from '@f2020/data';
import { TrackMapComponent, TrackMarker } from './track-map';

/** The cars on the track, from OpenF1's locations */
@Component({
  selector: 'f2020-live-track-drivers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (track.hasValue()) {
      <f2020-track-map class="block aspect-square max-h-[70vh] mx-auto" [track]="track.value()" [markers]="markers()" />
    } @else if (track.error()) {
      <p>Banen kunne ikke hentes</p>
    } @else {
      <p>Henter banen...</p>
    }
  `,
  imports: [TrackMapComponent],
})
export class LiveTrackDriversComponent {
  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();

  #live = inject(RaceResultProvider);
  #trackService = inject(TrackService);

  protected readonly track = rxResource({
    params: () => this.race(),
    stream: ({ params }) => this.#trackService.getTrack(params),
  });

  #locations = rxResource({
    params: () => ({ race: this.race(), drivers: this.drivers() }),
    stream: ({ params }) => this.#live.getLocations(params.race, params.drivers),
  });

  protected readonly markers = computed<TrackMarker[]>(() => {
    const track = this.track.value();
    const locations = this.#locations.value();
    if (!track || !locations) return [];
    return locations.map(({ driver, ...location }) => ({
      id: driver.driverId,
      progress: trackProgress(track, location),
      label: driver.code,
      color: driver.teamColor ? `#${driver.teamColor}` : undefined,
    }));
  });
}

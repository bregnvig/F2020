import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { IRace } from '@f2020/data';

const baseOptions: google.maps.MapOptions = {
  zoomControl: true,
  scrollwheel: false,
  fullscreenControl: false,
  streetViewControl: true,
  mapTypeControl: false,
  zoom: 15,
  mapTypeId: 'roadmap',
};

/** A wide dark line under the track, so it stands out on any part of the map */
const outlineOptions: google.maps.PolylineOptions = {
  strokeColor: '#212121',
  strokeOpacity: 0.9,
  strokeWeight: 10,
  clickable: false,
  zIndex: 1,
};

const trackOptions: google.maps.PolylineOptions = {
  strokeColor: '#e15e00',
  strokeOpacity: 0.9,
  strokeWeight: 6,
  clickable: false,
  zIndex: 2,
  // Arrows in the racing direction. The symbol points up, which the map rotates to follow the line
  icons: [{
    icon: {
      path: 'M 0,-2 L 1.5,1.5 L -1.5,1.5 Z',
      fillColor: '#ffffff',
      fillOpacity: 1,
      strokeWeight: 0,
      scale: 2.5,
    },
    offset: '40px',
    repeat: '120px',
  }],
};

const sameCenter = (a: google.maps.MapOptions, b: google.maps.MapOptions) =>
  a.center?.lat === b.center?.lat && a.center?.lng === b.center?.lng;

/**
 * Map of the race's circuit, with the track drawn on it when there is an outline for it.
 * The outlines are written to assets/tracks by the builder.
 */
@Component({
  selector: 'f2020-race-map',
  template: `
    <google-map
      width="100%"
      height="100%"
      [options]="options()"
      (mapInitialized)="googleMap.set($event)">
      @if (track.hasValue()) {
        <map-polyline [path]="track.value()" [options]="outlineOptions" />
        <map-polyline [path]="track.value()" [options]="trackOptions" />
      }
    </google-map>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GoogleMapsModule],
  host: {
    class: 'block h-full',
  },
})
export class RaceMapComponent {
  race = input.required<IRace>();

  protected outlineOptions = outlineOptions;
  protected trackOptions = trackOptions;
  // Only changes when the location does, as every change to the options resets the center and zoom of the map
  protected options = computed(
    () => ({ ...baseOptions, center: { lat: this.race().location.lat, lng: this.race().location.lng } }),
    { equal: sameCenter },
  );
  protected track = httpResource<google.maps.LatLngLiteral[]>(() => {
    const circuitId = this.race().circuitId;
    return circuitId != null ? `assets/tracks/${circuitId}.json` : undefined;
  });
  protected googleMap = signal<google.maps.Map | undefined>(undefined);

  constructor() {
    effect(() => {
      const map = this.googleMap();
      const path = this.track.hasValue() ? this.track.value() : [];
      if (map && path.length) {
        const bounds = new google.maps.LatLngBounds();
        path.forEach(point => bounds.extend(point));
        map.fitBounds(bounds, 16);
      }
    });
  }
}

import { computed, Resource, Signal } from '@angular/core';
import { IDriver, inPitLane, isStationary, LocationPlayback, LocationSample, Track, trackNearest } from '@f2020/data';

/**
 * The value of a resource, or undefined while it loads or has failed. Reading the value of a failed resource throws, which every
 * frame would break the page
 */
export const valueOf = <T>(resource: Resource<T | undefined>): Signal<T | undefined> => computed(() => (resource.hasValue() ? resource.value() : undefined));

export interface CarProgress {
  driver: IDriver;
  /** How far round the lap and how far from the track the car is at each of its samples */
  samples: { time: number; progress: number; distance: number }[];
  locations: LocationSample[];
}

type Nearest = ReturnType<typeof trackNearest>;

/** Where each sample is on each track. Every track of the page shares it, so a sample is only worked out once */
const nearestByTrack = new WeakMap<Track, WeakMap<LocationSample, Nearest>>();

/**
 * How far round the lap each car is at each of its samples. A sample is kept while it is drawn, so its progress is only
 * worked out once, and not for every frame
 */
export const carProgress = (track: Signal<Track | undefined>, playback: Signal<LocationPlayback | undefined>): Signal<CarProgress[]> =>
  computed(() => {
    const currentTrack = track();
    const currentPlayback = playback();
    if (!currentTrack || !currentPlayback) return [];
    const nearest = nearestByTrack.get(currentTrack) ?? new WeakMap<LocationSample, Nearest>();
    nearestByTrack.set(currentTrack, nearest);
    return currentPlayback.drivers.map(({ driver, samples }) => ({
      driver,
      locations: samples,
      samples: samples.map(sample => {
        const sampleNearest = nearest.get(sample) ?? trackNearest(currentTrack, sample);
        nearest.set(sample, sampleNearest);
        return { time: sample.time, ...sampleNearest };
      }),
    }));
  });

/** The drivers in the pit lane at the time, by driver id. A car that has stood still for a while is out of the race in its garage */
export const carsInPitLane = (cars: CarProgress[], now: number): Set<string> =>
  new Set(cars.filter(({ samples, locations }) => inPitLane(samples, now) && !isStationary(locations, now)).map(({ driver }) => driver.driverId));

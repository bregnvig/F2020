import { computed, Resource, Signal } from '@angular/core';
import { IDriver, LocationPlayback, LocationSample, Track, trackProgress } from '@f2020/data';

/**
 * The value of a resource, or undefined while it loads or has failed. Reading the value of a failed resource throws, which every
 * frame would break the page
 */
export const valueOf = <T>(resource: Resource<T | undefined>): Signal<T | undefined> => computed(() => resource.hasValue() ? resource.value() : undefined);

export interface CarProgress {
  driver: IDriver;
  samples: { time: number; progress: number }[];
  locations: LocationSample[];
}

/**
 * How far round the lap each car is at each of its samples. A sample is kept while it is drawn, so its progress is only
 * worked out once, and not for every frame
 */
export const carProgress = (track: Signal<Track | undefined>, playback: Signal<LocationPlayback | undefined>): Signal<CarProgress[]> => {
  const progress = new WeakMap<LocationSample, number>();
  return computed(() => {
    const currentTrack = track();
    const currentPlayback = playback();
    if (!currentTrack || !currentPlayback) return [];
    return currentPlayback.drivers.map(({ driver, samples }) => ({
      driver,
      locations: samples,
      samples: samples.map(sample => {
        const sampleProgress = progress.get(sample) ?? trackProgress(currentTrack, sample);
        progress.set(sample, sampleProgress);
        return { time: sample.time, progress: sampleProgress };
      }),
    }));
  });
};

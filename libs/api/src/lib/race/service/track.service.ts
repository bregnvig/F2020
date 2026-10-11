import { inject, Service } from '@angular/core';
import { buildTrack, IRace, Track } from '@f2020/data';
import { Lap } from '@f2020/openf1';
import { DateTime } from 'luxon';
import { catchError, defer, firstValueFrom, Observable, retry, shareReplay, throwError, timer } from 'rxjs';
import { OpenF1HttpService } from './openf1-http.service';

/** A lap has a location about every 0.3 second, so a lap with fewer is missing data */
const minimumPoints = 100;
const trackCache = new Map<string, Observable<Track>>();

/**
 * The track drawn from the fastest lap of the qualifying, as OpenF1's locations use the coordinates of the circuit and not
 * latitude and longitude. The qualifying is the day before the race, so the track is there before the race starts
 */
@Service()
export class TrackService {
  #openF1HttpService = inject(OpenF1HttpService);

  getTrack(race: IRace): Observable<Track> {
    const key = `${race.season}-${race.round}`;
    if (!trackCache.has(key)) {
      trackCache.set(key, defer(() => this.#loadTrack(race)).pipe(
        // OpenF1 may refuse a request when too many are made
        retry({ count: 4, delay: (_error, attempt) => timer(2000 * attempt) }),
        // A failed track is fetched again the next time
        catchError(error => {
          trackCache.delete(key);
          return throwError(() => error);
        }),
        shareReplay(1),
      ));
    }
    return trackCache.get(key)!;
  }

  async #loadTrack(race: IRace): Promise<Track> {
    const session = await firstValueFrom(this.#openF1HttpService.getSession(race, 'Qualifying'));
    const laps = await firstValueFrom(this.#openF1HttpService.getLaps(session.session_key));
    const fastest = laps
      .filter((lap): lap is Lap & { lap_duration: number } => !!lap.lap_duration && !!lap.date_start && !lap.is_pit_out_lap)
      .toSorted((a, b) => a.lap_duration - b.lap_duration)
      .slice(0, 3);
    for (const lap of fastest) {
      const start = DateTime.fromISO(lap.date_start);
      const locations = await firstValueFrom(this.#openF1HttpService.getLocations(session.session_key, start, start.plus({ seconds: lap.lap_duration }), lap.driver_number));
      if (locations.length >= minimumPoints) {
        return buildTrack(locations);
      }
    }
    throw new Error(`No locations for a lap of the qualifying of ${race.name}`);
  }
}

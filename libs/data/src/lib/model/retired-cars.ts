import { isStationary, LocationSample } from './track.model';

/** A car is stopped when it hasn't moved for this long */
const stoppedPeriod = 10_000;
/** How long a car going out of the race takes to fade away */
const retiringDuration = 2500;

/**
 * Which cars are out of the race. It is kept for the page, so the track in the card and in fullscreen agree, and a car does not go
 * out again every time the fullscreen is opened
 */
export class RetiredCars {
  /** When each car was found out of the race. It stays out whatever the locations say after that */
  #retiredAt = new Map<string, number>();
  /** When the car was seen going out, so it plays out in real time whatever the speed of the relive */
  #retiringSince = new Map<string, number>();
  /** When most of the cars started driving */
  #drivingSince?: number;

  /**
   * Finds the cars out of the race at `now`, the time of the race. A car that has stopped while most of the others drive is out.
   * On the grid or under a red flag most have stopped, and at the start the cars pull away one after the other, so a car still on the
   * grid is not out until most have driven for as long as it takes to be taken as stopped.
   * `frame` is the real time, which the animation of going out is timed by
   */
  update(cars: { id: string; locations: LocationSample[] }[], now: number, frame: number): void {
    const stopped = cars.filter(({ locations }) => isStationary(locations, now, stoppedPeriod)).map(({ id }) => id);
    const driving = stopped.length < cars.length / 2;
    this.#drivingSince = driving ? Math.min(this.#drivingSince ?? now, now) : undefined;
    if (driving && now - this.#drivingSince! >= stoppedPeriod) {
      // The earliest time it was found, as the relive can be moved back to before it was first seen
      stopped.forEach(id => {
        if (now < (this.#retiredAt.get(id) ?? Number.MAX_VALUE)) {
          this.#retiredAt.has(id) || this.#retiringSince.set(id, frame);
          this.#retiredAt.set(id, now);
        }
      });
    }
  }

  /**
   * Undefined while the car is in the race, else how far it is in going out, from 0 to 1 and beyond when it is gone.
   * Moving the relive back to before it went out shows it again
   */
  retiring(id: string, now: number, frame: number): number | undefined {
    if ((this.#retiredAt.get(id) ?? Number.MAX_VALUE) > now) return undefined;
    return Math.max(0, (frame - (this.#retiringSince.get(id) ?? 0)) / retiringDuration);
  }
}

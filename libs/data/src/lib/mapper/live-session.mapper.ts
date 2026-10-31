import { Interval, Lap, Position, Stint } from '@f2020/openf1';
import { isTruthy } from '@f2020/tools';
import { IDriver, ILiveSessionDriver, Tyre } from '../model';
import { getDrivers } from './mapper-utils';

export interface OpenF1LiveSessionParams {
  /** The latest position of each driver */
  positions: Position[];
  laps: Lap[];
  /** The latest interval of each driver. Only in the sprint and the race */
  intervals: Interval[];
  stints: Stint[];
  drivers: IDriver[];
  /** Ordered by position, as in the sprint and the race, instead of by the best lap */
  byPosition: boolean;
}

const milliseconds = (seconds: number | null | undefined) => (typeof seconds === 'number' ? Math.round(seconds * 1000) : undefined);

const byDriver = <T extends { driver_number: number }>(items: T[]) =>
  items.reduce((map, item) => map.set(item.driver_number, [...(map.get(item.driver_number) ?? []), item]), new Map<number, T[]>());

export const map = ({ positions, laps, intervals, stints, drivers, byPosition }: OpenF1LiveSessionParams): ILiveSessionDriver[] => {
  const driverMap = getDrivers(drivers);
  const lapsByDriver = byDriver(laps);
  const stintsByDriver = byDriver(stints);
  const intervalByDriver = new Map(intervals.map(interval => [interval.driver_number, interval]));

  const results = positions
    .map(position => {
      const driver = driverMap.get(position.driver_number);
      if (!driver) return undefined;
      const driverLaps = (lapsByDriver.get(position.driver_number) ?? []).toSorted((a, b) => a.lap_number - b.lap_number);
      const lap = driverLaps.at(-1)?.lap_number ?? 0;
      const times = driverLaps.map(l => milliseconds(l.lap_duration)).filter(isTruthy);
      const stint = (stintsByDriver.get(position.driver_number) ?? []).toSorted((a, b) => a.stint_number - b.stint_number).at(-1);
      const gapToLeader = intervalByDriver.get(position.driver_number)?.gap_to_leader as number | string | null | undefined;
      return {
        driver,
        position: position.position,
        lap,
        bestLap: times.length ? Math.min(...times) : undefined,
        lastLap: milliseconds(driverLaps.findLast(l => l.lap_duration)?.lap_duration),
        fastest: false,
        gap: byPosition && typeof gapToLeader === 'number' ? milliseconds(gapToLeader) : undefined,
        lapsBehind: byPosition && typeof gapToLeader === 'string' ? gapToLeader : undefined,
        tyre: stint?.compound as Tyre | undefined,
        tyreAge: stint ? stint.tyre_age_at_start + Math.max(lap - stint.lap_start, 0) : undefined,
      } satisfies ILiveSessionDriver;
    })
    .filter(isTruthy);

  const best = Math.min(...results.map(r => r.bestLap ?? Number.MAX_SAFE_INTEGER));
  const ordered = byPosition
    ? results.toSorted((a, b) => a.position - b.position)
    : results.toSorted((a, b) => (a.bestLap ?? Number.MAX_SAFE_INTEGER) - (b.bestLap ?? Number.MAX_SAFE_INTEGER) || a.position - b.position);

  return ordered.map((result, index) => ({
    ...result,
    // Ordered by the best lap, the place is in that order, as the position from OpenF1 may lag behind the laps
    position: byPosition ? result.position : index + 1,
    fastest: result.bestLap === best,
    gap: byPosition ? result.gap : result.bestLap !== undefined && result.bestLap !== best ? result.bestLap - best : undefined,
  }));
};

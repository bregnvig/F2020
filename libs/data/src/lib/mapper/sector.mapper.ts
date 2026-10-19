import { Lap } from '@f2020/openf1';
import { isTruthy, requiredValue } from '@f2020/tools';
import { IDriver, ISector, SectorColor, SectorColorMap } from '../model';
import { IDriverSector } from '../model/sector.model';
import { getDrivers } from './mapper-utils';

export interface OpenF1SectorParams {
  laps: Lap[];
  drivers: IDriver[];
  /**
   * A relive has the whole lap from its start, so the sectors driven after this time, in milliseconds, are left out. Live laps only
   * have the sectors driven
   */
  now?: number;
}

type SectorTimes = [number | undefined, number | undefined, number | undefined];

/** The times of the sectors driven by `now`. A sector without a time leaves out the sectors after it, as when it ended is unknown */
const drivenSectors = (lap: Lap, now?: number): SectorTimes => {
  const start = Date.parse(lap.date_start);
  let end: number | undefined = start;
  return [lap.duration_sector_1, lap.duration_sector_2, lap.duration_sector_3].map(duration => {
    end = end !== undefined && duration ? end + duration * 1000 : undefined;
    return end !== undefined && (now === undefined || end <= now) ? duration : undefined;
  }) as SectorTimes;
};

const minimum = (times: (number | undefined)[]) =>
  times.reduce<number | undefined>((min, time) => (time !== undefined && (min === undefined || time < min) ? time : min), undefined);

const sectorColor = (duration: number | undefined, personalBest: number | undefined, best: number | undefined): SectorColor | undefined => {
  if (!duration) return;
  if (duration === best) return 'purple';
  if (duration === personalBest) return 'green';
  return 'yellow';
};

export const map = ({ laps, drivers, now }: OpenF1SectorParams): IDriverSector[] => {
  const driverMap = getDrivers(drivers);
  const driven = laps.map(lap => ({ lap, sectors: drivenSectors(lap, now) }));

  const lapsByDriver = driven.reduce(
    (byDriver, lap) => byDriver.set(lap.lap.driver_number, [...(byDriver.get(lap.lap.driver_number) ?? []), lap]),
    new Map<number, typeof driven>(),
  );

  const fastest = [0, 1, 2].map(sector => minimum(driven.map(({ sectors }) => sectors[sector])));
  const personalBests = driven.reduce((best, { lap, sectors }) => {
    const current = best.get(lap.driver_number);
    return best.set(lap.driver_number, sectors.map((time, sector) => minimum([time, current?.[sector]])) as SectorTimes);
  }, new Map<number, SectorTimes>());

  return [...lapsByDriver.values()].map(driverLaps => {
    const latest = driverLaps.at(-1)!;
    // The sectors of the lap before are shown until the first sector of the new lap is driven
    const { lap, sectors } = latest.sectors[0] === undefined && driverLaps.length > 1 ? driverLaps.at(-2)! : latest;
    const [sector1, sector2, sector3] = [0, 1, 2].map((sector): ISector => {
      const status = sectorColor(sectors[sector], personalBests.get(lap.driver_number)?.[sector], fastest[sector]);
      const segments = [lap.segments_sector_1, lap.segments_sector_2, lap.segments_sector_3][sector];
      return {
        status,
        // The mini sectors of a sector not driven yet are left out as well
        mini: now === undefined || status ? segments?.filter(isTruthy).map(segment => SectorColorMap[segment]) : undefined,
      };
    });
    return {
      driver: requiredValue(driverMap.get(lap.driver_number), 'Driver'),
      lap: latest.lap.lap_number,
      sectorsLap: lap.lap_number,
      sector1,
      sector2,
      sector3,
    };
  });
};

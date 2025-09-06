import { Lap } from '@f2020/openf1';
import { IDriver, SectorColor, SectorColorMap } from '../model';
import { getDrivers } from './mapper-utils';
import { isNotNullish, requiredValue } from '@f2020/tools';
import { IDriverSector } from '../model/sector.model';

export interface OpenF1SectorParams {
  laps: Lap[];
  drivers: IDriver[];
}

const openF1Map = ({ laps, drivers }: OpenF1SectorParams): IDriverSector[] => {
  const driverMap = getDrivers(drivers);
  if (!laps.length) return [];

  // Group laps by driver and get the latest lap for each driver
  const latestLaps = laps.toReversed().reduce((acc, lap) => {
    if (!acc.has(lap.driver_number)) {
      acc.set(lap.driver_number, lap);
    }
    return acc;
  }, new Map<number, Lap>());

  // Calculate fastest sectors in the race
  const fastestSector1 = Math.min(...laps.filter(l => l.duration_sector_1).map(l => l.duration_sector_1));
  const fastestSector2 = Math.min(...laps.filter(l => l.duration_sector_2).map(l => l.duration_sector_2));
  const fastestSector3 = Math.min(...laps.filter(l => l.duration_sector_3).map(l => l.duration_sector_3));

  // Calculate fastest sectors for each driver
  const driverFastestSectors = laps.reduce((acc, lap) => {
    const current = acc.get(lap.driver_number) || { sector1: undefined, sector2: undefined, sector3: undefined };

    return acc.set(lap.driver_number, {
      sector1: isNotNullish(lap.duration_sector_1) && isNotNullish(current.sector1) ? Math.min(current.sector1, lap.duration_sector_1) : current.sector1,
      sector2: isNotNullish(lap.duration_sector_2) && isNotNullish(current.sector2) ? Math.min(current.sector2, lap.duration_sector_2) : current.sector2,
      sector3: isNotNullish(lap.duration_sector_3) && isNotNullish(current.sector3) ? Math.min(current.sector3, lap.duration_sector_3) : current.sector3,
    });
  }, new Map<number, { sector1: number | undefined; sector2: number | undefined; sector3: number | undefined; }>());

  const getSectorColor = (duration: number | undefined, personalBest: number, best: number): SectorColor | undefined => {
    if (!duration) return;
    if (duration === best) return 'purple';
    if (duration === personalBest) return 'green';
    return 'yellow';
  };

  return [...latestLaps.values()].map(lap => {
    const driver = requiredValue(driverMap.get(lap.driver_number), 'Driver');
    const driverSectors = driverFastestSectors.get(lap.driver_number);
    return {
      driver,
      sector1: {
        status: getSectorColor(lap.duration_sector_1, driverSectors?.sector1 ?? lap.duration_sector_1, fastestSector1),
        mini: lap.segments_sector_1?.map(status => SectorColorMap[status]),
      },
      sector2: {
        status: getSectorColor(lap.duration_sector_2, driverSectors?.sector2 ?? lap.duration_sector_2, fastestSector2),
        mini: lap.segments_sector_2?.map(status => SectorColorMap[status]),
      },
      sector3: {
        status: getSectorColor(lap.duration_sector_3, driverSectors?.sector3 ?? lap.duration_sector_3, fastestSector3),
        mini: lap.segments_sector_3?.map(status => SectorColorMap[status]),
      },
    } as IDriverSector;
  });
};

export const map = (params: OpenF1SectorParams): IDriverSector[] => openF1Map(params);

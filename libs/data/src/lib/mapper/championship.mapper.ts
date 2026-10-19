import { DriverChampionship, TeamChampionship } from '@f2020/openf1';
import { ChampionshipStart, ChampionshipStarts } from '../model/championship.model';
import { IDriver } from '../model/driver.model';
import { findDriver, getDrivers } from './mapper-utils';

const start = ({ points_start, position_start }: DriverChampionship | TeamChampionship): ChampionshipStart => ({
  points: points_start,
  position: position_start,
});

/** The championship before the session, from the OpenF1 championship of the session */
export const map = (drivers: IDriver[], driverChampionship: DriverChampionship[], teamChampionship: TeamChampionship[]): ChampionshipStarts => {
  const driverMap = getDrivers(drivers);
  return {
    drivers: new Map(
      driverChampionship
        .map(championship => ({ driver: findDriver(driverMap, championship.driver_number, 'Championship'), championship }))
        .filter(({ driver }) => !!driver)
        .map(({ driver, championship }) => [driver!.driverId, start(championship)]),
    ),
    teams: new Map(teamChampionship.map(championship => [championship.team_name, start(championship)])),
  };
};

import { ErgastDriverStanding, IDriverStanding } from '../model';
import * as driverMap from './driver.mapper';

export const driverStanding = (d: ErgastDriverStanding): IDriverStanding => {
  return {
    driver: driverMap.driver(d.Driver),
    points: d.points,
    wins: parseInt(d.wins)
  };
};

export const driverStandings = (standings: ErgastDriverStanding[]) => standings.map(driverStanding);

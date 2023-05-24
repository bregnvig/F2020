import { ErgastDriverQualifying, IDriverQualifying, qualifyToMilliseconds } from '../model';
import { driver } from './driver.mapper';

export const driverQualifying = (result: ErgastDriverQualifying): IDriverQualifying => {
  return {
    driver: driver(result.Driver),
    position: parseInt(result.position, 10),
    q1: result.Q1 ? qualifyToMilliseconds(result.Q1) : -1,
    q2: result.Q2 ? qualifyToMilliseconds(result.Q2) : undefined,
    q3: result.Q3 ? qualifyToMilliseconds(result.Q3) : undefined,
  };
};

export const driversQualifying = (_drivers: ErgastDriverQualifying[]) => _drivers.map(driverQualifying);

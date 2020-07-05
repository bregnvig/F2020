import { ErgastDriverQualifying, IDriverQualifying, qualifyToMillis } from '../model';
import { driver } from './driver.mapper';

export const driverQualifying = (result: ErgastDriverQualifying): IDriverQualifying => {
  return {
    driver: driver(result.Driver),
    position: parseInt(result.position, 10),
    q1: result.Q1 ? qualifyToMillis(result.Q1) : null,
    q2: result.Q2 ? qualifyToMillis(result.Q2) : null,
    q3: result.Q3 ? qualifyToMillis(result.Q3) : null,
  };
};

export const driverQualifyings = (_drivers: ErgastDriverQualifying[]) => _drivers.map(driverQualifying);

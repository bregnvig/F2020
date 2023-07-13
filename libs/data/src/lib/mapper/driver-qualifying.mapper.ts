import { filterNullish } from '@f2020/tools';
import { ErgastDriverQualifying, IDriverQualifying, toMilliseconds } from '../model';
import { driver } from './driver.mapper';

export const driverQualifying = (result: ErgastDriverQualifying): IDriverQualifying => {
  return filterNullish({
    driver: driver(result.Driver),
    position: parseInt(result.position, 10),
    q1: result.Q1 ? toMilliseconds(result.Q1) : -1,
    q2: result.Q2 ? toMilliseconds(result.Q2) : undefined,
    q3: result.Q3 ? toMilliseconds(result.Q3) : undefined,
  });
};

export const driversQualifying = (_drivers: ErgastDriverQualifying[]) => _drivers.map(driverQualifying);

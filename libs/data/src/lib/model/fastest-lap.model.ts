import { IDriver } from './driver.model';

export interface IDriverLapTime {
  driver: IDriver;
  lap: number;
  /** Seconds */
  time: number;
}

/** The best lap of each driver, the fastest first */
export interface IFastestLaps {
  laps: IDriverLapTime[];
}

import { IDriver } from './driver.model';

export interface IDriverLapTime {
  driver: IDriver;
  lap: number;
  /** Seconds */
  time: number;
}

export type LapColor = 'yellow' | 'green' | 'purple';

export interface ILatestLap extends IDriverLapTime {
  /** Purple when it is the fastest lap of the race so far, green when it is the driver's best, else yellow */
  color: LapColor;
}

/** The best lap of each driver, the fastest first */
export interface IFastestLaps {
  laps: IDriverLapTime[];
  /** The latest lap of each driver */
  latest: ILatestLap[];
}

import { ErgastConstructor } from './constructor.model';
import { ErgastRace } from './race.model';

export interface ErgastDriver {
  readonly driverId: string;
  readonly permanentNumber: string;
  readonly code: string;
  readonly url: string;
  readonly givenName: string;
  readonly familyName: string;
  readonly dateOfBirth: string;
  readonly nationality: string;
}


export interface ErgastDriverStanding {
  wins: string;
  points: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
}

export interface ErgastFastestLap {
  rank: string;
  lap: string;
  Time: {
    time: string;
  },
  AverageSpeed: {
    speed: string;
  };
}

export interface ErgastDriverResults extends ErgastRace {
  Results: ErgastDriverResult[];
}

export interface ErgastDriverResult {
  Driver: ErgastDriver;
  Constructor: ErgastConstructor,
  points: string;
  position: string;
  grid: string;
  status: string;
  FastestLap: ErgastFastestLap;
}

export interface ErgastDriversQualifying extends ErgastRace {
  QualifyingResults: ErgastDriverQualifying[];
}

export const toMilliseconds = (time: string): number => {
  const groups = /^(\d)?:?(\d{2})\.(\d*)$/.exec(time);
  if (groups) {
    const minutes = groups[1] ? parseInt(groups[1], 10) * 1000 * 60 : 0;
    const seconds = parseInt(groups[2], 10) * 1000;
    const milliseconds = parseInt(groups[3], 10);
    return minutes + seconds + milliseconds;
  }
  console.warn(`Could not parse qualifying time: ${time}`);
  return -1;
};

export interface ErgastDriverQualifying {
  Driver: ErgastDriver;
  Constructor: ErgastConstructor,
  position: string;
  Q1: string;
  Q2: string;
  Q3: string;
}

export interface ErgastPitStop {
  driverId: string;
  stop: string;
  lap: string;
  time: string;
  duration: string;
}

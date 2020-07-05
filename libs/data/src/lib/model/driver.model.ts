export interface IDriver {
  readonly name: string;
  readonly driverId: string;
  readonly code: string;
  readonly nationality: string;
  readonly permanentNumber: number
  readonly url: string;
}

export class DriverModel implements IDriver {
  readonly name: string;
  readonly driverId: string;
  readonly code: string;
  readonly nationality: string;
  readonly permanentNumber: number;
  readonly url: string;

  constructor({ name, driverId, code, nationality, permanentNumber, url }: IDriver) {
    this.name = name;
    this.driverId = driverId;
    this.code = code;
    this.nationality = nationality;
    this.permanentNumber = permanentNumber;
    this.url = url;
  }
}

export interface IFastestLap {
  rank: number;
  lap: number;
  time: number;
  averageSpeed: number;
}

export interface IDriverStanding {
  wins: number;
  points: number;
  driver: IDriver;
}

export interface IDriverResult {
  retired: number;
  averageGridPosition: number;
  averageFinishPosition: number;
  results: IDriverRaceResult[];
}

export const finished = (status: string): boolean =>  /(\+[0-9] Lap)|(Finished)/.test(status);

export interface IDriverRaceResult {
  driver: IDriver;
  points: number
  position: number;
  grid: number;
  status: string;
  fastestLap?: IFastestLap;
}

export interface IDriverQualifying {
  driver: IDriver;
  position: number;
  q1: number;
  q2?: number;
  q3?: number;
}

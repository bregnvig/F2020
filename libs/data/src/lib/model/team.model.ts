import { IDriver } from './driver.model';

export interface ITeam {
  constructorId: string;
  name: string;
  url: string;
  countryCode: string;
  points: number;
  drivers: IDriver[];
}
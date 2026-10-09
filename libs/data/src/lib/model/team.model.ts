import { IChampionshipPoints } from './championship.model';

export interface ITeam extends IChampionshipPoints {
  constructorId: string;
  name: string;
  drivers: string[];
  previousDrivers?: string[];
}


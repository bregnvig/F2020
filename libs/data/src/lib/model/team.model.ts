export interface ITeam {
  constructorId: string;
  name: string;
  points: number;
  drivers: string[];
  previousDrivers?: string[];
}

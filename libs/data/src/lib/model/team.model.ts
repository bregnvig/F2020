export interface ITeam {
  constructorId: string;
  name: string;
  previousNames?: string[];
  url: string;
  countryCode?: string;
  points: number;
  drivers: string[];
  previousDrivers?: string[];
}

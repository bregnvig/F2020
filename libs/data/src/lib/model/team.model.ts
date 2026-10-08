import { IChampionshipPoints } from './championship.model';

export interface ITeam extends IChampionshipPoints {
  constructorId: string;
  name: string;
  drivers: string[];
  previousDrivers?: string[];
}

/**
 * Colour logo of the team from formula1.com. The path is the team name as OpenF1 has it, in lower case without spaces,
 * e.g. Haas F1 Team is haasf1team. It is not an official API, so it may break.
 */
export const teamLogoUrl = (seasonId: string | number, teamName: string): string => {
  const slug = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://media.formula1.com/image/upload/c_lfill,w_96/q_auto/v1740000001/common/f1/${seasonId}/${slug}/${seasonId}${slug}logo.webp`;
};

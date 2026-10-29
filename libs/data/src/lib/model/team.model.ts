import { IChampionshipPoints } from './championship.model';

export interface ITeam {
  constructorId: string;
  name: string;
  drivers: string[];
  previousDrivers?: string[];
}

/** The place and points of a team in the championship after a race */
export interface ITeamRound {
  position: number;
  points: number;
}

/** The team in the championship, from OpenF1. The team itself, which an admin edits, is in seasons/{seasonId}/teams */
export interface ITeamStanding extends IChampionshipPoints {
  /** The race and sprint wins of the drivers of the team */
  wins: number;
  /** The place and points after each race, by round */
  rounds: Record<number, ITeamRound>;
}

/**
 * The championship of the teams, in seasons/{seasonId}/standings/teams, by constructor id. It is written with merge, so a race adds its
 * round without reading the rounds before it
 */
export type ITeamStandings = Record<string, ITeamStanding>;

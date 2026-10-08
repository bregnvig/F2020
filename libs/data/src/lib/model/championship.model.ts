import { DriverChampionship, TeamChampionship } from '@f2020/openf1';

/**
 * The championship points and position after the last race weekend, and before it.
 */
export interface IChampionshipPoints {
  points: number;
  position?: number;
  previousPoints?: number;
  previousPosition?: number;
}

export const championshipPoints = (championship: DriverChampionship | TeamChampionship): IChampionshipPoints => ({
  points: championship.points_current,
  position: championship.position_current,
  previousPoints: championship.points_start,
  previousPosition: championship.position_start,
});

/**
 * Places moved since the last race weekend. Positive when moving up. Zero when unknown.
 */
export const positionChange = ({ position, previousPosition }: IChampionshipPoints): number =>
  position && previousPosition ? previousPosition - position : 0;

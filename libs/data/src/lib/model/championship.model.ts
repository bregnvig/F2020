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

/**
 * OpenF1 has the standing before the session in `points_start` and `position_start`. On a sprint weekend the race session starts
 * after the sprint, so pass the championship of the sprint as `weekendStart` to compare with the standing before the weekend.
 */
export const championshipPoints = (championship: DriverChampionship | TeamChampionship, weekendStart = championship): IChampionshipPoints => ({
  points: championship.points_current,
  position: championship.position_current,
  previousPoints: weekendStart.points_start,
  previousPosition: weekendStart.position_start,
});

/**
 * Places moved since the last race weekend. Positive when moving up. Zero when unknown.
 */
export const positionChange = ({ position, previousPosition }: IChampionshipPoints): number =>
  position && previousPosition ? previousPosition - position : 0;

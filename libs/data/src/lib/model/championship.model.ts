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
export const positionChange = ({ position, previousPosition }: IChampionshipPoints): number => (position && previousPosition ? previousPosition - position : 0);

/** The points and place in the championship before a session */
export interface ChampionshipStart {
  points: number;
  position?: number;
}

/** The championship before the race, the drivers by id and the teams by the OpenF1 name */
export interface ChampionshipStarts {
  drivers: Map<string, ChampionshipStart>;
  teams: Map<string, ChampionshipStart>;
}

/** The points for the places of a race, from first to tenth */
export const racePoints = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

/**
 * The championship as it would be if the race ended now, from the points before it and the points gained in it. Ties keep the order
 * from before the race, as the tie-break on the best results isn't known
 */
export const championshipNow = <K>(start: Map<K, ChampionshipStart>, gained: Map<K, number>): { key: K; standing: IChampionshipPoints }[] =>
  [...new Set([...start.keys(), ...gained.keys()])]
    .map(key => ({ key, before: start.get(key), points: (start.get(key)?.points ?? 0) + (gained.get(key) ?? 0) }))
    .sort((a, b) => b.points - a.points || (a.before?.position ?? Number.MAX_VALUE) - (b.before?.position ?? Number.MAX_VALUE))
    .map(({ key, before, points }, index) => ({
      key,
      standing: { points, position: index + 1, previousPoints: before?.points ?? 0, previousPosition: before?.position },
    }));

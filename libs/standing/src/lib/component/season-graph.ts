export interface Race {
  round: number;
  name: string;
  results: { position?: number }[];
}

export interface Point {
  name: number;
  value: number;
}

/** The name of the race without "Grand Prix", so it fits on the axis */
const shortName = (race: Race) => race.name.replace(/ Grand Prix$/, '');

/** Every race of the season in order. The x of a race is its index, so the races are evenly spaced and in order, also when a driver
 * has no place in one of them */
export const seasonRaces = (races: Race[]) =>
  [...new Map(races.map(race => [race.round, shortName(race)])).entries()].sort(([a], [b]) => a - b).map(([round, name]) => ({ round, name }));

/** The places are negative, so 1 is at the top of the graph */
export const points = (races: Race[] = [], season: { round: number }[]): Point[] =>
  races
    .filter(race => race.results[0]?.position)
    .map(race => ({ name: season.findIndex(r => r.round === race.round), value: -race.results[0].position! }))
    .sort((a, b) => a.name - b.name);

/** The points split where a race has no place, as ngx-charts draws a line across the gap */
export const segments = (points: Point[]): Point[][] =>
  points.reduce<Point[][]>((acc, point, index) => {
    if (index && point.name - points[index - 1].name === 1) {
      acc.at(-1)!.push(point);
    } else {
      acc.push([point]);
    }
    return acc;
  }, []);

/** A race with no place on either side is a single point, which ngx-charts does not draw, so it is drawn as a short dash */
export const dash = (segment: Point[]): Point[] =>
  segment.length === 1
    ? [
        { name: segment[0].name - 0.15, value: segment[0].value },
        { name: segment[0].name + 0.15, value: segment[0].value },
      ]
    : segment;

/** The lowest place, and at least 20 so the graph does not jump */
export const lastPlace = (series: { series: Point[] }[]) => Math.max(20, ...series.flatMap(d => d.series.map(p => -p.value)));

export const placeTicks = (last: number) => [1, 5, 10, 15, 20, last].filter((tick, index, ticks) => ticks.indexOf(tick) === index).map(tick => -tick);

export const place = (value: number) => `${Math.abs(value)}`;

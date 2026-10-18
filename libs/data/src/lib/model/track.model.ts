import { IDriver } from './driver.model';

export interface TrackPoint {
  x: number;
  y: number;
  z: number;
  /** The distance from the start of the lap */
  distance: number;
}

/** One lap of a car, in the coordinates of OpenF1's locations. It runs in the racing direction from the finish line */
export interface Track {
  points: TrackPoint[];
  length: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** 1 when the outside is to the left of the racing direction, which it is on a track driven clockwise, else -1 */
  outside: 1 | -1;
}

/** A location of a car at a time in milliseconds */
export interface LocationSample {
  time: number;
  x: number;
  y: number;
  z: number;
}

/** The locations of a driver's car, oldest first */
export interface IDriverLocations {
  driver: IDriver;
  samples: LocationSample[];
}

/**
 * The cars are drawn for every frame at the time `now()` returns, between the samples around it, so they move smoothly
 * however often the samples arrive
 */
export interface LocationPlayback {
  drivers: IDriverLocations[];
  now: () => number;
}

type Point3D = Pick<TrackPoint, 'x' | 'y' | 'z'>;

const distance = (a: Point3D, b: Point3D) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** The track from the locations of one lap. The last point is joined to the first, so it is a loop */
export const buildTrack = (locations: Point3D[]): Track => {
  const points = locations.reduce((acc, { x, y, z }, index) => {
    acc.push({ x, y, z, distance: index ? acc[index - 1].distance + distance(acc[index - 1], { x, y, z }) : 0 });
    return acc;
  }, [] as TrackPoint[]);
  const last = points.at(-1)!;
  const area = points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    return sum + p.x * q.y - q.x * p.y;
  }, 0);
  return {
    outside: area < 0 ? 1 : -1,
    points,
    length: last.distance + distance(last, points[0]),
    minX: Math.min(...points.map(p => p.x)),
    minY: Math.min(...points.map(p => p.y)),
    maxX: Math.max(...points.map(p => p.x)),
    maxY: Math.max(...points.map(p => p.y)),
  };
};

/**
 * Where a location is on the track: how far round the lap, from 0 at the finish line to 1, and how far from the track it is.
 * The height is included in the distance, so a car on a bridge is not put on the road below it
 */
export const trackNearest = (track: Track, location: Point3D): { progress: number; distance: number } => {
  const { points, length } = track;
  const { index, fraction, d } = points.reduce((best, point, i) => {
    const next = points[(i + 1) % points.length];
    const [dx, dy, dz] = [next.x - point.x, next.y - point.y, next.z - point.z];
    const segment = dx * dx + dy * dy + dz * dz;
    const t = segment ? Math.max(0, Math.min(1, ((location.x - point.x) * dx + (location.y - point.y) * dy + (location.z - point.z) * dz) / segment)) : 0;
    const d = distance(location, { x: point.x + t * dx, y: point.y + t * dy, z: point.z + t * dz });
    return d < best.d ? { index: i, fraction: t, d } : best;
  }, { index: 0, fraction: 0, d: Number.MAX_VALUE });
  const start = points[index].distance;
  const end = index === points.length - 1 ? length : points[index + 1].distance;
  return { progress: (start + fraction * (end - start)) / length, distance: d };
};

/**
 * A car further from the track than this is in the pit lane. On the track a car is at most a few metres from the line of the fastest
 * lap of the qualifying, and in the pit lane 6 to 19 metres, in OpenF1's units of about 10 cm
 */
export const pitLaneDistance = 80;

/** A car must be off the track this long to be in the pit lane, so going wide in a corner doesn't count */
const pitLaneHold = 3000;

/** If the car is in the pit lane at the time, from how far from the track it has been the last 3 seconds */
export const inPitLane = (samples: { time: number; distance: number }[], now: number): boolean => {
  const recent = samples.filter(({ time }) => time > now - pitLaneHold && time <= now);
  return recent.length > 1 && recent.at(-1)!.time - recent[0].time >= pitLaneHold / 2 && recent.every(({ distance }) => distance > pitLaneDistance);
};

/** How far round the lap a location is, from 0 at the finish line to 1 */
export const trackProgress = (track: Track, location: Point3D): number => trackNearest(track, location).progress;

/** The points on each side of a point used for its direction, so the direction turns smoothly through a corner */
const directionSpan = 3;

/** The unit normal to the left of the racing direction at a point of the track */
const normalAt = ({ points }: Track, index: number) => {
  const before = points[(index - directionSpan + points.length) % points.length];
  const after = points[(index + directionSpan) % points.length];
  const [dx, dy] = [after.x - before.x, after.y - before.y];
  const length = Math.hypot(dx, dy) || 1;
  return { nx: -dy / length, ny: dx / length };
};

/** The point at a progress round the lap, and the unit normal to the left of the racing direction, which turns smoothly */
export const trackPosition = (track: Track, progress: number): { x: number; y: number; nx: number; ny: number } => {
  const { points, length } = track;
  const target = (((progress % 1) + 1) % 1) * length;
  const index = Math.max(0, points.findLastIndex(p => p.distance <= target));
  const point = points[index];
  const nextIndex = (index + 1) % points.length;
  const next = points[nextIndex];
  const end = index === points.length - 1 ? length : next.distance;
  const t = end > point.distance ? (target - point.distance) / (end - point.distance) : 0;
  const [a, b] = [normalAt(track, index), normalAt(track, nextIndex)];
  const [nx, ny] = [a.nx + t * (b.nx - a.nx), a.ny + t * (b.ny - a.ny)];
  const normal = Math.hypot(nx, ny) || 1;
  return { x: point.x + t * (next.x - point.x), y: point.y + t * (next.y - point.y), nx: nx / normal, ny: ny / normal };
};

/**
 * The progress at a time, between the samples around it. Before the first and after the last sample it is that sample's progress.
 * A car crossing the finish line goes on to the next lap instead of back round the lap
 */
export const progressAt = (samples: { time: number; progress: number }[], time: number): number | undefined => {
  if (!samples.length) return undefined;
  const next = samples.findIndex(sample => sample.time > time);
  if (next === 0) return samples[0].progress;
  if (next === -1) return samples.at(-1)!.progress;
  const [a, b] = [samples[next - 1], samples[next]];
  const delta = ((b.progress - a.progress) % 1 + 1.5) % 1 - 0.5;
  return a.progress + delta * (time - a.time) / (b.time - a.time);
};

/**
 * A car that has moved less than `distance` over the last `period` milliseconds, e.g. one that has retired.
 * It needs locations from most of the period, so a car is not taken as stationary before there are enough
 */
export const isStationary = (samples: LocationSample[], now: number, period = 10_000, distance = 50): boolean => {
  const recent = samples.filter(({ time }) => time > now - period && time <= now);
  if (recent.length < 2 || recent.at(-1)!.time - recent[0].time < period * 0.8) return false;
  const [first] = recent;
  return recent.every(({ x, y }) => Math.hypot(x - first.x, y - first.y) < distance);
};

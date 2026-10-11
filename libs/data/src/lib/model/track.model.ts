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
}

/** The latest location of a driver's car */
export interface IDriverLocation {
  driver: IDriver;
  x: number;
  y: number;
  z: number;
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
  return {
    points,
    length: last.distance + distance(last, points[0]),
    minX: Math.min(...points.map(p => p.x)),
    minY: Math.min(...points.map(p => p.y)),
    maxX: Math.max(...points.map(p => p.x)),
    maxY: Math.max(...points.map(p => p.y)),
  };
};

/**
 * How far round the lap a location is, from 0 at the finish line to 1. The height is included in the distance,
 * so a car on a bridge is not put on the road below it
 */
export const trackProgress = (track: Track, location: Point3D): number => {
  const { points, length } = track;
  const { index, fraction } = points.reduce((best, point, i) => {
    const next = points[(i + 1) % points.length];
    const [dx, dy, dz] = [next.x - point.x, next.y - point.y, next.z - point.z];
    const segment = dx * dx + dy * dy + dz * dz;
    const t = segment ? Math.max(0, Math.min(1, ((location.x - point.x) * dx + (location.y - point.y) * dy + (location.z - point.z) * dz) / segment)) : 0;
    const d = distance(location, { x: point.x + t * dx, y: point.y + t * dy, z: point.z + t * dz });
    return d < best.d ? { index: i, fraction: t, d } : best;
  }, { index: 0, fraction: 0, d: Number.MAX_VALUE });
  const start = points[index].distance;
  const end = index === points.length - 1 ? length : points[index + 1].distance;
  return (start + fraction * (end - start)) / length;
};

/** The point at a progress round the lap, and the unit normal to the left of the racing direction */
export const trackPosition = (track: Track, progress: number): { x: number; y: number; nx: number; ny: number } => {
  const { points, length } = track;
  const target = (((progress % 1) + 1) % 1) * length;
  const index = Math.max(0, points.findLastIndex(p => p.distance <= target));
  const point = points[index];
  const next = points[(index + 1) % points.length];
  const end = index === points.length - 1 ? length : next.distance;
  const t = end > point.distance ? (target - point.distance) / (end - point.distance) : 0;
  const [dx, dy] = [next.x - point.x, next.y - point.y];
  const segment = Math.hypot(dx, dy) || 1;
  return { x: point.x + t * dx, y: point.y + t * dy, nx: -dy / segment, ny: dx / segment };
};

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Circuit, Coordinate } from '@f2020/data';
import { assetPath } from './assets';
import { cachedFetch } from './cached-fetch';

/** Track outlines as GeoJSON LineStrings, MIT licensed. https://github.com/bacinger/f1-circuits */
const trackSource = 'https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson';

interface TrackFeature {
  properties: { id: string, Name: string };
  geometry: { type: 'LineString', coordinates: [number, number][] };
}

/**
 * Circuits whose outline in the dataset runs against the racing direction, so the direction arrows would point backwards.
 * Found by comparing the winding of each outline with OpenF1 car positions. Marina Bay is raced anticlockwise.
 */
const reversedTracks = new Set([61]);

const round = (value: number) => Math.round(value * 1e6) / 1e6;

const svgSize = 1000;
const svgPadding = 30;

/**
 * The outline as a black track with a white edge, on a transparent background. The longest side is `svgSize`.
 * The longitude is scaled by the cosine of the latitude, so the track keeps its shape
 */
const trackSvg = (path: Coordinate[]): string => {
  const scaleX = Math.cos(path.reduce((sum, { lat }) => sum + lat, 0) / path.length * Math.PI / 180);
  const points = path.map(({ lat, lng }) => ({ x: lng * scaleX, y: -lat }));
  const minX = Math.min(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const width = Math.max(...points.map(p => p.x)) - minX;
  const height = Math.max(...points.map(p => p.y)) - minY;
  const scale = (svgSize - 2 * svgPadding) / Math.max(width, height);
  const [viewWidth, viewHeight] = [width * scale + 2 * svgPadding, height * scale + 2 * svgPadding].map(Math.round);
  const d = points
    .map(({ x, y }, index) => `${index ? 'L' : 'M'}${((x - minX) * scale + svgPadding).toFixed(1)} ${((y - minY) * scale + svgPadding).toFixed(1)}`)
    .join('') + 'Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewWidth} ${viewHeight}" width="${viewWidth}" height="${viewHeight}">
  <g fill="none" stroke-linejoin="round" stroke-linecap="round">
    <path d="${d}" stroke="#fff" stroke-width="22"/>
    <path d="${d}" stroke="#000" stroke-width="12"/>
  </g>
</svg>
`;
};

/**
 * Writes the outline of every circuit with a trackId to `{outDir}/{circuitId}.json`, as an array of { lat, lng }, and as `{circuitId}.svg`.
 * The UI draws it as a polyline on the race map. The outline is closed, so the polyline forms a loop,
 * and runs in the racing direction, so the map can show direction arrows along it.
 */
export const buildTracks = async (outDir: string): Promise<number> => {
  const circuits: Circuit[] = JSON.parse(readFileSync(assetPath('circuits.json')).toString());
  const features: TrackFeature[] = await cachedFetch(trackSource)
    .then(response => response.json())
    .then(geojson => geojson.features);
  const featureById = new Map(features.map(feature => [feature.properties.id, feature]));

  mkdirSync(outDir, { recursive: true });
  return circuits.reduce((count, circuit) => {
    const feature = circuit.trackId ? featureById.get(circuit.trackId) : undefined;
    if (feature?.geometry.type !== 'LineString') {
      console.warn('No track found for', circuit.circuitId, circuit.circuitName, circuit.trackId);
      return count;
    }
    const path: Coordinate[] = feature.geometry.coordinates.map(([lng, lat]) => ({ lat: round(lat), lng: round(lng) }));
    reversedTracks.has(circuit.circuitId) && path.reverse();
    const [first, last] = [path[0], path.at(-1)];
    if (first.lat !== last.lat || first.lng !== last.lng) {
      path.push(first);
    }
    writeFileSync(join(outDir, `${circuit.circuitId}.json`), JSON.stringify(path));
    writeFileSync(join(outDir, `${circuit.circuitId}.svg`), trackSvg(path));
    console.log('Wrote track', circuit.circuitId, feature.properties.Name, path.length, 'points');
    return count + 1;
  }, 0);
};

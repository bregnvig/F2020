import { Coordinate } from './coordinate.model';

export interface Circuit {
  circuitId: number;
  circuitName: string;
  name: string;
  countryCode2: string;
  countryCode3: string;
  location: Coordinate;
  /** Id of the track in the bacinger/f1-circuits GeoJSON, used to draw the track on the map */
  trackId?: string;
}

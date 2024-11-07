import { Coordinate } from './coordinate.model';

export interface Circuit {
  circuitId: number;
  circuitName: string;
  name: string;
  countryCode2: string;
  countryCode3: string;
  location: Coordinate;
}

import { driver, drivers, joinDrivers } from './driver.mapper';
import { map as nationality } from './nationality.mapper';
import { pitStops } from './pit-stop.mapper';
import { polePosition } from './pole-position.mapper';
import { map as qualifyResult } from './qualify-result.mapper';
import { map as raceResult } from './race-result.mapper';
import { basisMap as basisRace, map as race } from './race.mapper';
import { map as season } from './season.mapper';

export const mapper = {
  basisRace,
  race,
  raceResult,
  qualifyResult,
  driver,
  drivers,
  joinDrivers,
  season,
  nationality,
  polePosition,
  pitStops,
};

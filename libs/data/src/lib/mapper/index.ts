import { driverQualifying, driversQualifying } from './driver-qualifying.mapper';
import { driverResult, driverResults } from './driver-result.mapper';
import { driverStanding, driverStandings } from './driver-standing.mapper';
import { driver, drivers } from './driver.mapper';
import { map as nationality } from './nationality.mapper';
import { pitStops } from './pit-stop.mapper';
import { polePosition } from './pole-position.mapper';
import { map as qualifyResult } from './qualify-result.mapper';
import { map as raceResult } from './race-result.mapper';
import { basisMap as basisRace, map as race } from './race.mapper';
import { map as season } from './season.mapper';
import { team } from './team.mapper';

export const mapper = {
  basisRace,
  race,
  raceResult,
  qualifyResult,
  driver,
  drivers,
  driverStanding,
  driverStandings,
  driverResult,
  driverResults,
  driverQualifying,
  driversQualifying,
  season,
  nationality,
  polePosition,
  pitStops,
  team,
};

import { driver, drivers, joinDrivers } from './driver.mapper';
import { map as nationality } from './nationality.mapper';
import { pitStops } from './pit-stop.mapper';
import { polePosition } from './pole-position.mapper';
import { map as qualifyResult } from './qualify-result.mapper';
import { map as intervalMapper } from './interval.mapper';
import { map as liveRaceResult } from './live-race-result.mapper';
import { map as raceResult } from './race-result.mapper';
import { basisMap as basisRace, map as race } from './race.mapper';
import { map as season } from './season.mapper';
import { map as position } from './position.mapper';
import { map as grid } from './grid-position.mapper';
import { map as radio } from './radio.mapper';
import { map as raceControl } from './race-control.mapper';

export const mapper = {
  basisRace,
  race,
  liveRaceResult,
  raceResult,
  qualifyResult,
  driver,
  drivers,
  intervalMapper,
  joinDrivers,
  season,
  nationality,
  pitStops,
  polePosition,
  position,
  radio,
  raceControl,
  grid,
};

import { IDriver, IPitStop, ITeam } from '../model';
import { PitStop } from '@f2020/openf1';
import { requiredValue, toMap } from '@f2020/tools';
import { getDrivers } from './mapper-utils';


interface OpenF1PitstopParams {
  pitStops: PitStop[];
  drivers: IDriver[];
  teams: ITeam[];
}

const openF1PitStops = (params: OpenF1PitstopParams) => {
  const drivers = getDrivers(params.drivers);
  const teams = params.teams.reduce((acc, team) => {
    team.drivers.forEach(driverId => acc.set(driverId, team));
    return acc;
  }, new Map<string, ITeam>());

  // A pit stop can arrive more than once, e.g. from both the history and the live updates. Keep the latest, and skip
  // the ones without a duration, which would otherwise be the fastest pit stop
  const pitStops = params.pitStops
    .filter(pitStop => pitStop.pit_duration != null)
    .reduce(toMap<PitStop, string>(pitStop => `${pitStop.driver_number}-${pitStop.lap_number}`), new Map<string, PitStop>());

  return [...pitStops.values()].map(pitStop => {
    const driver = requiredValue(drivers.get(pitStop.driver_number), 'Pit stop driver with driver number', pitStop.driver_number);
    return ({
      driver,
      team: requiredValue(teams.get(driver.driverId), 'Pit stop team with driver id', driver),
      lap: pitStop.lap_number,
      duration: pitStop.pit_duration * 1000,
    });
  });
};


export function pitStops(params: OpenF1PitstopParams): IPitStop[] {
  return openF1PitStops(params);
}

import { IDriver, IPitStop, ITeam } from '../model';
import { PitStop } from '@f2020/openf1';
import { requiredValue } from '@f2020/tools';
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

  return params.pitStops.map(pitStop => {
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

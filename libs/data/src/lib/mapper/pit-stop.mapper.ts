import { IDriver, IPitStop, ITeam } from '../model';
import { PitStop } from '@f2020/openf1';


interface OpenF1PitstopParams {
  pitStops: PitStop[];
  drivers: IDriver[];
  teams: ITeam[];
}

const openF1PitStops = (params: OpenF1PitstopParams) => {
  const drivers = params.drivers.reduce((acc, driver) => {
    driver.permanentNumber.forEach(number => acc.set(number, driver));
    return acc;
  }, new Map<number, IDriver>());
  const teams = params.teams.reduce((acc, team) => {
    team.drivers.forEach(driverId => acc.set(driverId, team));
    return acc;
  }, new Map<string, ITeam>());

  return params.pitStops.map(pitStop => ({
    driver: drivers.get(pitStop.driver_number)!,
    team: teams.get(drivers.get(pitStop.driver_number)!.driverId),
    lap: pitStop.lap_number,
    duration: pitStop.pit_duration * 1000,
  }));
};


export function pitStops(params: OpenF1PitstopParams): IPitStop[] {
  return openF1PitStops(params);
}

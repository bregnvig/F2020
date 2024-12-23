import { ErgastPitStop, IDriver, IPitStop, ITeam, toMilliseconds } from '../model';
import { PitStop } from '@f2020/openf1';

const pitStop = (result: ErgastPitStop, drivers: IDriver[], teams: ITeam[]): IPitStop => {
  return {
    driver: drivers.find(d => d.driverId === result.driverId.trim())!,
    team: teams.find(t => t.drivers.includes(result.driverId.trim()))!,
    stop: parseInt(result.stop, 10),
    lap: parseInt(result.lap, 10),
    duration: toMilliseconds(result.duration)!,
  };
};

interface OpenF1PitstopParams {
  pitStops: PitStop[];
  drivers: IDriver[];
  teams: ITeam[];
}

const ergastPitStops = (_pitStops: ErgastPitStop[], drivers: IDriver[], teams: ITeam[]) => _pitStops
  .map(p => pitStop(p, drivers, teams));

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


export function pitStops(params: OpenF1PitstopParams): IPitStop[];
export function pitStops(_pitStops: ErgastPitStop[], drivers: IDriver[], teams: ITeam[]): IPitStop[];
export function pitStops(_pitStops: ErgastPitStop[] | OpenF1PitstopParams, drivers?: IDriver[], teams?: ITeam[]) {
  if (Array.isArray(_pitStops)) {
    return ergastPitStops(_pitStops, drivers!, teams!);
  }
  return openF1PitStops(_pitStops);
}

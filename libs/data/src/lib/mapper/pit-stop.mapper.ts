import { ErgastPitStop, IDriver, IPitStop, ITeam, toMilliseconds } from '../model';

const pitStop = (result: ErgastPitStop, drivers: IDriver[], teams: ITeam[]): IPitStop => {
  return {
    driver: drivers.find(d => d.driverId === result.driverId)!,
    team: teams.find(t => t.drivers.includes(result.driverId))!,
    stop: parseInt(result.stop, 10),
    lap: parseInt(result.lap, 10),
    duration: toMilliseconds(result.duration)!,
  };
};

export const pitStops = (_pitStops: ErgastPitStop[], drivers: IDriver[], teams: ITeam[]) => _pitStops
  .map(p => pitStop(p, drivers, teams));

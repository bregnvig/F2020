import { ErgastDriverResult, ErgastDriverResults, IDriverRaceResult } from '../model';
import { driver } from './driver.mapper';

// "1:25.580"
const toMillis = (time: string) => {
  const groups = /(\d):(\d{2}).(\d{3})/.exec(time)!;
  const minutes = parseInt(groups[1], 10) * 60 * 1000;
  const seconds = parseInt(groups[2], 10) * 1000;
  const millis = parseInt(groups[3], 10);
  return minutes + seconds + millis;
};

export const driverResult = (result: ErgastDriverResult): IDriverRaceResult => {
  const converted: IDriverRaceResult = {
    driver: driver(result.Driver),
    points: parseInt(result.points, 10),
    position: parseInt(result.position, 10),
    grid: parseInt(result.grid, 10),
    status: result.status,
  };
  if (result.FastestLap) {
    converted.fastestLap = {
      rank: parseInt(result.FastestLap.rank, 10),
      lap: parseInt(result.FastestLap.lap, 10),
      averageSpeed: parseFloat(result?.FastestLap.AverageSpeed.speed),
      time: toMillis(result.FastestLap.Time.time)
    };
  }
  return converted;
};

export const driverResults = (_drivers: ErgastDriverResults) => _drivers.Results.map(driverResult);

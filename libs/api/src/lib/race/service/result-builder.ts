import { Bid, finished, IDriverQualifying, IDriverRaceResult, IQualifyResult, IRaceResult, SelectedDriverValue } from '@f2020/data';

const getDriverId = (result: IDriverRaceResult | IDriverQualifying) => result.driver.driverId;

export const buildResult = (race: IRaceResult, qualify: IQualifyResult, selectedDriver: string): Bid => {

  const qualifyResult = qualify.results.slice(0, 7).map(getDriverId)

  const fastestDriverResult = [...race.results]
    .filter(result => !!result.fastestLap)
    .sort((a, b) => (a.fastestLap.rank ?? 100) - (b.fastestLap.rank ?? 100))
    .slice(0, 2)
    .map(getDriverId);
  const podiumResult = race.results.slice(0, 4).map(getDriverId);
  const driver = race.results.find(r => r.driver.driverId === selectedDriver);
  const selectedDriverResult: SelectedDriverValue = {
    grid: driver.grid,
    finish: race.results.indexOf(driver) + 1
  };
  const firstCrashResult = [...race.results].reverse().filter(r => !finished(r.status)).slice(0, 3).map(getDriverId);
  return <Bid>{
    qualify: qualifyResult,
    fastestDriver: fastestDriverResult,
    podium: podiumResult,
    selectedDriver: selectedDriverResult,
    firstCrash: firstCrashResult,
    polePositionTime: qualify.results[0].q3
  }
} 

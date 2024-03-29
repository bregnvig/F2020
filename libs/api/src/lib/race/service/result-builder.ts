import { Bid, finished, IDriverQualifying, IDriverRaceResult, IPitStop, IQualifyResult, IRaceResult, ITeam, SelectedDriverValue, SelectedTeamValue } from '@f2020/data';

const getDriverId = (result: IDriverRaceResult | IDriverQualifying) => result.driver.driverId;

export const buildResult = (race: IRaceResult, qualify: IQualifyResult, pitStops: IPitStop[], selectedDriver: string, selectedTeam: ITeam): Bid => {

  const qualifyResult = qualify.results.slice(0, 7).map(getDriverId);
  const pitStopResult = [...new Set<string>(pitStops.sort((a, b) => b.duration - a.duration).map(p => p.team.constructorId))].slice(0, 2);

  const fastestDriverResult = [...race.results]
    .filter(result => !!result.fastestLap)
    .sort((a, b) => (a.fastestLap.rank ?? 100) - (b.fastestLap.rank ?? 100))
    .slice(0, 2)
    .map(getDriverId);
  const podiumResult = race.results.slice(0, 4).map(getDriverId);
  const driver = race.results.find(r => r.driver.driverId === selectedDriver);
  const selectedDriverResult: SelectedDriverValue = {
    grid: driver?.grid || race.results.length,
    finish: race.results.indexOf(driver) !== -1 ? race.results.indexOf(driver) + 1 : 1
  };
  const selectedTeamResult: SelectedTeamValue = {
    qualify: selectedTeam ? qualify.results.find(r => selectedTeam.drivers.some(d => d === r.driver.driverId)).driver.driverId : undefined,
    result: selectedTeam ? race.results.find(r => selectedTeam.drivers.some(d => d === r.driver.driverId)).driver.driverId : undefined
  };
  const firstCrashResult = [...race.results].reverse().filter(r => !finished(r.status)).slice(0, 3).map(getDriverId);
  return <Bid>{
    qualify: qualifyResult,
    fastestDriver: fastestDriverResult,
    podium: podiumResult,
    selectedDriver: selectedDriverResult,
    selectedTeam: selectedTeamResult,
    firstCrash: firstCrashResult,
    slowestPitStop: pitStopResult,
    polePositionTime: qualify.results[0].q3
  };
};

export const buildInterimResult = (qualify: IQualifyResult, selectedDriver: string, team: ITeam): Partial<Bid> => {
  const qualifyResult = qualify.results.slice(0, 7).map(getDriverId);
  const driver = qualify.results.find(r => r.driver.driverId === selectedDriver);
  const selectedDriverResult: Partial<SelectedDriverValue> = {
    grid: driver.position,
  };
  const selectedTeamResult: Partial<SelectedTeamValue> = {
    qualify: qualify.results.find(r => team?.drivers.some(d => d === r.driver.driverId))?.driver.driverId
  };
  return <Partial<Bid>>{
    qualify: qualifyResult,
    selectedDriver: selectedDriverResult,
    selectedTeam: selectedTeamResult,
    polePositionTime: qualify.results[0].q3
  };
};

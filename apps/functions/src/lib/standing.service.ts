import { ErgastDriversQualifying, ErgastRaceResult, finished, IDriverResult, IDriverStanding, IQualifyResult, mapper } from '@f2020/data';
import { getDriverStandings as getStandings, getQualifyResults, getRaceResults } from '@f2020/ergast-api';

export const getDriverStandings = async (seasonId: string): Promise<IDriverStanding[]> => {
  return getStandings(seasonId).then(standings => mapper.driverStandings(standings));
};

export const getDriverResults = async (seasonId: string): Promise<{ driverId: string, result: IDriverResult; }[]> => {
  const ergastRaces = await getRaceResults(seasonId);
  const driverIds = new Set<string>(
    ergastRaces.flatMap(race => race.Results.map(result => result.Driver.driverId)),
  );
  return [...driverIds].map(driverId => {
    const races = ergastRaces
      .map(race => ({
        ...race,
        Results: race.Results.filter(result => result.Driver.driverId === driverId),
      }) as ErgastRaceResult)
      .filter(race => race.Results.length > 0)
      .map(mapper.raceResult);
    return {
      driverId,
      result: {
        races,
        retired: races.reduce((acc, race) => acc += (finished(race.results[0].status) ? 0 : 1), 0),
        averageFinishPosition: races.reduce((acc, race) => acc + race.results[0].position, 0) / races.length,
        averageGridPosition: races.reduce((acc, race) => acc + race.results[0].grid, 0) / races.length,
      } as IDriverResult,
    };
  });
};

export const getDriverQualify = async (seasonId: string): Promise<Record<string, IQualifyResult[]>> => {
  const ergastQualifying = await getQualifyResults(seasonId);
  const driverIds = new Set<string>(
    ergastQualifying.flatMap(race => race.QualifyingResults.map(result => result.Driver.driverId)),
  );
  return [...driverIds].reduce((acc, driverId) => {
    acc[driverId] = ergastQualifying.map(race => ({
      ...race,
      QualifyingResults: race.QualifyingResults.filter(result => result.Driver.driverId === driverId),
    }) as ErgastDriversQualifying)
      .filter(race => race.QualifyingResults.length > 0)
      .map(mapper.qualifyResult);
    return acc;
  }, {});
};

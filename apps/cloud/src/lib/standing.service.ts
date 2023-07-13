import { ErgastDriverStanding, IDriverStanding, mapper } from "@f2020/data";
// import { getQualifyResults, getRaceResults, getDriverStandings as getStandings } from "@f2020/ergast";
import { getDriverStandings as getStandings } from "@f2020/ergast-api";

import axios, { AxiosInstance } from 'axios';

const _http = axios.create({
  baseURL: 'https://ergast.com/api/f1/'
});

export const getClient = (): AxiosInstance => {
  return _http;
};

export const getDriverStandings = async (seasonId: string): Promise<IDriverStanding[]> => {
  await getStandings(seasonId).then(standings => mapper.driverStandings(standings));
  return getClient().get<any>(`${seasonId}/driverStandings.json`)
    .then(({ data }) => (data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? []) as ErgastDriverStanding[])
    .then(standings => mapper.driverStandings(standings));
  // return Promise.resolve([]);
};

// export const getDriverResult = async (seasonId: string): Promise<IDriverResult[]> => {
//   const ergastRaces = await getRaceResults(seasonId);
//   const driverIds = new Set<string>(
//     ergastRaces.flatMap(race => race.Results.map(result => result.Driver.driverId)),
//   );
//   return [...driverIds].map(driverId => {
//     const races = ergastRaces
//       .map(race => ({
//         ...race,
//         Results: race.Results.filter(result => result.Driver.driverId === driverId)
//       }) as ErgastRaceResult)
//       .map(mapper.raceResult);
//     return <IDriverResult>{
//       driverId,
//       races,
//       retired: races.reduce((acc, race) => acc += (finished(race.results[0].status) ? 0 : 1), 0),
//       averageFinishPosition: races.reduce((acc, race) => acc + race.results[0].position, 0) / races.length,
//       averageGridPosition: races.reduce((acc, race) => acc + race.results[0].grid, 0) / races.length,
//     };
//   });
// };

// export const getDriverQualify = async (seasonId: string): Promise<{ driverId: string, results: IQualifyResult[]; }[]> => {
//   const ergastQualifying = await getQualifyResults(seasonId);
//   const driverIds = new Set<string>(
//     ergastQualifying.flatMap(race => race.QualifyingResults.map(result => result.Driver.driverId)),
//   );
//   return [...driverIds].map(driverId => {
//     return {
//       driverId,
//       results: ergastQualifying.map(race => ({
//         ...race,
//         QualifyingResults: race.QualifyingResults.filter(result => result.Driver.driverId === driverId)
//       }) as ErgastDriversQualifying)
//         .map(mapper.qualifyResult)
//     };
//   });
// };
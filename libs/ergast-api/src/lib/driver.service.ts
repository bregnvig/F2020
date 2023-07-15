import { ErgastConstructor, ErgastConstructorStanding, ErgastDriver, ErgastDriverStanding } from '@f2020/data';
import { getClient } from './axios';

/**
 * Given a season id an array of drivers will be returned.
 * Drivers must be sorted by last year constructor result.
 * If it is a constructor, the constructors will be sorted by name
 */

type LookupByConstructor = (lookup: ErgastConstructor) => number;

const sortByName = (a: ErgastConstructor, b: ErgastConstructor) => a.name.localeCompare(b.name);
const indexOfConstructor = (constructors: ErgastConstructor[]): LookupByConstructor => {
  return (lookup => {
    const index = constructors.findIndex(c => c.constructorId === lookup.constructorId);
    return index !== -1 ? index : 100;
  });
};

const sortByIndexAndName = (lookup: LookupByConstructor): (a: ErgastConstructor, b: ErgastConstructor) => number => {
  return (a, b) => {
    const aIndex = lookup(a);
    const bIndex = lookup(b);
    return aIndex - bIndex || sortByName(a, b);
  };
};

/** Returns all drivers with a code */
export const getDrivers = async (): Promise<ErgastDriver[]> => {
  return getClient().get('/drivers.json?limit=1000')
    .then(result => result.data)
    .then(data => data.MRData.DriverTable.Drivers);
};

/**
 *
 * @param seasonId Returns a specified seasons drivers
 * @param round
 */
export const getFullSeasonDrivers = async (seasonId: string): Promise<ErgastDriver[]> => {
  const constructorStanding: ErgastConstructorStanding[] = await getClient().get(`/${seasonId}/constructorStandings.json`)
    .then(result => result.data)
    // .then(data => console.log(data.MRData.StandingsTable));
    .then(data => data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings);

  const constructorIds: string[] = constructorStanding.map(cs => cs.Constructor.constructorId);
  const driverStanding: ErgastDriverStanding[] = await getDriverStandings(parseInt(seasonId, 10));

  driverStanding.sort((a, b) => {
    const aConstructorIndex = constructorIds.indexOf(a.Constructor.constructorId);
    const bConstructorIndex = constructorIds.indexOf(b.Constructor.constructorId);
    return aConstructorIndex - bConstructorIndex || parseInt(b.points) - parseInt(a.points);
  });

  return Promise.resolve(driverStanding.map(ds => ds.Driver));

};
/**
 * Returns the latest know drivers for given season.
 * @param seasonId
 * @param round Drivers from a specific round
 */
export const getSeasonDrivers = async (seasonId: string, round: string): Promise<ErgastDriver[]> => {

  const http = getClient();

  const currentConstructors: ErgastConstructor[] = await http.get<any>(`/${seasonId}/constructors.json`)
    .then(result => result.data.MRData.ConstructorTable.Constructors)
    .catch(error => console.error(error));

  const previousSeasonId = parseInt(seasonId, 10) - 1;
  const previousDriverStanding: ErgastDriverStanding[] = await getDriverStandings(previousSeasonId);
  const previousConstructors: ErgastConstructor[] = await http.get<any>(`/${previousSeasonId}/constructorStandings.json`)
    .then(result => result.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings.map((standing: any) => standing.Constructor))
    .catch(error => console.error(error));
  const sort = sortByIndexAndName(indexOfConstructor(previousConstructors));
  currentConstructors.sort(sort);
  const drivers: ErgastDriver[][] = await Promise.all(currentConstructors.map(c => getConstructorDrivers(c.constructorId, seasonId, previousDriverStanding, round)));
  return drivers.flat();
};

const getConstructorDrivers = async (constructorId: string, seasonId: string, previousYearDriverStanding: ErgastDriverStanding[], round: string): Promise<ErgastDriver[]> => {
  const http = getClient();
  const sort = (a: ErgastDriver, b: ErgastDriver): number => {
    const aStandingPoints = parseInt(previousYearDriverStanding.find(ds => ds.Driver.code === a.code)?.points ?? '0', 10);
    const bStandingPoints = parseInt(previousYearDriverStanding.find(ds => ds.Driver.code === b.code)?.points ?? '0', 10);
    return bStandingPoints - aStandingPoints;
  };
  return http.get(`/${seasonId}/${round}/constructors/${constructorId}/drivers.json`)
    .then<ErgastDriver[]>(result => result.data.MRData.DriverTable.Drivers)
    .then(drivers => drivers.sort(sort));
};

const getDriverStandings = async (seasonId: number, round?: number): Promise<ErgastDriverStanding[]> => {
  const roundUrl = round === undefined ? '' : `${round}/`;
  return getClient().get(`/${seasonId}/${roundUrl}driverStandings.json`)
    .then(result => result.data)
    .then(mrData => mrData.MRData.StandingsTable.StandingsLists[0].DriverStandings)
    .then((standings: any[]) => standings.map(s => <ErgastDriverStanding>{
      wins: s.wins,
      points: s.points,
      Driver: s.Driver,
      Constructor: s.Constructors[s.Constructors.length - 1]
    })
    );
};
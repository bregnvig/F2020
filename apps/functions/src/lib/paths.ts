const seasonsURL = 'seasons';
const racesURL = 'races';
const playersURL = 'players';

export const documentPaths = {
  season: (seasonId: string | number) => `${seasonsURL}/${seasonId}`,
  participant: (seasonId: string, raceId: string | number, uid: string) => `${seasonsURL}/${seasonId}/${racesURL}/${raceId}/participants/${uid}`,
  bid: (seasonId: string | number, raceId: string | number, uid: string) => `${seasonsURL}/${seasonId}/${racesURL}/${raceId}/bids/${uid}`,
  player: (uid: string) => `${playersURL}/${uid}`,
  race: (seasonId: string | number, raceId: string | number) => `${seasonsURL}/${seasonId}/${racesURL}/${raceId}`,
  standing: {
    allDriver: (seasonId: string | number) => `${seasonsURL}/${seasonId}/standings/all-drivers`,
    driver: (seasonId: string | number, resultSeasonId: string | number, driverId: string) => `${seasonsURL}/${seasonId}/standings/drivers/${resultSeasonId}/${driverId}`,
  },
};

export const collectionPaths = {
  seasons: () => `${seasonsURL}`,
  players: () => `${playersURL}`,
  bids: (seasonId: string | number, raceId: string | number) => `${seasonsURL}/${seasonId}/${racesURL}/${raceId}/bids`,
  races: (seasonId: string | number) => `${seasonsURL}/${seasonId}/${racesURL}`,
  standings: {
    drivers: (seasonId: string | number, resultSeasonId: string | number) => `${seasonsURL}/${seasonId}/standings/drivers/${resultSeasonId}`,
  },
};

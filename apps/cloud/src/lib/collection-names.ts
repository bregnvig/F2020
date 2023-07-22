
export const seasonsURL = 'seasons';
export const racesURL = 'races';
export const playersURL = 'players';
export const transactionsURL = 'transactions';

export const documentPaths = {
  participant: (seasonId: string, raceId: string | number, uid: string) => `${seasonsURL}/${seasonId}/${racesURL}/${raceId}/participants/${uid}`,
  bid: (seasonId: string, raceId: string | number, uid: string) => `${seasonsURL}/${seasonId}/${racesURL}/${raceId}/bids/${uid}`,
};
/**
 * The page with the result of a session, relative to the page of the driver. The session pages of this year are under the race,
 * last year's results are only in the standings
 */
export const driverSessionLink = (round: number, session: 'qualifying' | 'race', lastYear: boolean) =>
  lastYear ? ['..', 'last-year', round, session] : ['../..', 'race', round, 'session', session];

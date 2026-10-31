/** The session names of OpenF1 */
export type SessionName = 'Practice 1' | 'Practice 2' | 'Practice 3' | 'Sprint Qualifying' | 'Sprint' | 'Qualifying' | 'Race';

export const openF1Url = {
  session: (seasonId: string | number, circuitKey: number, sessionName: SessionName) =>
    `https://api.openf1.org/v1/sessions?year=${seasonId}&circuit_key=${circuitKey}&session_name=${encodeURIComponent(sessionName)}`,
  positions: (sessionKey: number) => `https://api.openf1.org/v1/position?session_key=${sessionKey}`,
  intervals: (sessionKey: number) => `https://api.openf1.org/v1/intervals?session_key=${sessionKey}`,
  labs: (sessionKey: number) => `https://api.openf1.org/v1/laps?session_key=${sessionKey}`,
  pitStops: (sessionKey: number) => `https://api.openf1.org/v1/pit?session_key=${sessionKey}`,
  sessionResults: (sessionKey: number) => `https://api.openf1.org/v1/session_result?session_key=${sessionKey}`,
  championshipDrivers: (sessionKey: number) => `https://api.openf1.org/v1/championship_drivers?session_key=${sessionKey}`,
  championshipTeams: (sessionKey: number) => `https://api.openf1.org/v1/championship_teams?session_key=${sessionKey}`,
  startingGrid: (sessionKey: number) => `https://api.openf1.org/v1/starting_grid?session_key=${sessionKey}`,
  stints: (sessionKey: number) => `https://api.openf1.org/v1/stints?session_key=${sessionKey}`,
  weather: (sessionKey: number) => `https://api.openf1.org/v1/weather?session_key=${sessionKey}`,
  location: (sessionKey: number) => `https://api.openf1.org/v1/location?session_key=${sessionKey}`,
  driver: (sessionKey?: number) => `https://api.openf1.org/v1/drivers?session_key=${sessionKey ?? 'latest'}`,
  radio: (sessionKey?: number) => `https://api.openf1.org/v1/team_radio?session_key=${sessionKey ?? 'latest'}`,
  raceControl: (sessionKey?: number) => `https://api.openf1.org/v1/race_control?session_key=${sessionKey ?? 'latest'}`,
  token: () => `https://api.openf1.org/token`,
} as const;

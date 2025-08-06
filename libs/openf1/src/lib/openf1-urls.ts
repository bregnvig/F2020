export const openF1Url = {
  session: (seasonId: string | number, circuitKey: number, sessionName: 'Race' | 'Qualifying' | 'Sprint') => `https://api.openf1.org/v1/sessions?year=${seasonId}&circuit_key=${circuitKey}&session_name=${sessionName}`,
  positions: (sessionKey: number) => `https://api.openf1.org/v1/position?session_key=${sessionKey}`,
  intervals: (sessionKey: number) => `https://api.openf1.org/v1/intervals?session_key=${sessionKey}`,
  labs: (sessionKey: number) => `https://api.openf1.org/v1/laps?session_key=${sessionKey}`,
  pitStops: (sessionKey: number) => `https://api.openf1.org/v1/pit?session_key=${sessionKey}`,
  sessionResults: (sessionKey: number) => `https://api.openf1.org/v1/session_result?session_key=${sessionKey}`,
  startingGrid: (sessionKey: number) => `https://api.openf1.org/v1/starting_grid?session_key=${sessionKey}`,
  driver: (sessionKey?: number) => `https://api.openf1.org/v1/drivers?session_key=${sessionKey ?? 'latest'}`,
  radio: (sessionKey?: number) => `https://api.openf1.org/v1/team_radio?session_key=${sessionKey ?? 'latest'}`,
  token: () => `https://api.openf1.org/token`,
} as const;

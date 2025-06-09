export const openF1Url = {
  session: (seasonId: string | number, circuitKey: number, sessionName: 'Race' | 'Qualifying' | 'Sprint') => `https://api.openf1.org/v1/sessions?year=${seasonId}&circuit_key=${circuitKey}&session_name=${sessionName}`,
  positions: (sessionKey: number) => `https://api.openf1.org/v1/position?session_key=${sessionKey}`,
  labs: (sessionKey: number) => `https://api.openf1.org/v1/laps?session_key=${sessionKey}`,
  pitStops: (sessionKey: number) => `https://api.openf1.org/v1/pit?session_key=${sessionKey}`,
  driver: (sessionKey?: number) => `https://api.openf1.org/v1/drivers?session_key=${sessionKey ?? 'latest'}`,
  radio: (sessionKey?: number) => `https://api.openf1.org/v1/team_radio?session_key=${sessionKey ?? 'latest'}`,
} as const;

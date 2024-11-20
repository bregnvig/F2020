const url = {
  session: (seasonId: string | number, circuitKey: number, sessionName: 'Race' | 'Qualifying') => `https://api.openf1.org/v1/sessions?year=${seasonId}&circuit_key=${circuitKey}&session_name=${sessionName}`,
  positions: (sessionKey: number) => `https://api.openf1.org/v1/position?session_key=${sessionKey}`,
  labs: (sessionKey: number) => `https://api.openf1.org/v1/lap?session_key=${sessionKey}`,
};

export const openF1 = {
  url,
} as const;

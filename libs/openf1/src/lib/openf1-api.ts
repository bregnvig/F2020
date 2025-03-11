import axios, { AxiosInstance } from 'axios';
import { Driver, Lap, PitStop, Position, Session } from './model';

const url = {
  session: (seasonId: string | number, circuitKey: number, sessionName: 'Race' | 'Qualifying') => `https://api.openf1.org/v1/sessions?year=${seasonId}&circuit_key=${circuitKey}&session_name=${sessionName}`,
  positions: (sessionKey: number) => `https://api.openf1.org/v1/position?session_key=${sessionKey}`,
  labs: (sessionKey: number) => `https://api.openf1.org/v1/laps?session_key=${sessionKey}`,
  pitStops: (sessionKey: number) => `https://api.openf1.org/v1/pit?session_key=${sessionKey}`,
  driver: (sessionKey?: number) => `https://api.openf1.org/v1/drivers?session_key=${sessionKey ?? 'latest'}`,
};


const _http = axios.create({
  baseURL: 'https://api.openf1.org/v1/',
});

const client = (): AxiosInstance => {
  return _http;
};

const api = {
  session: async (seasonId: string | number, circuitKey: number, sessionName: 'Race' | 'Qualifying') => _http.get<Session[]>(url.session(seasonId, circuitKey, sessionName))
    .then(response => response.data)
    .then(sessions => sessions[0]),
  positions: async (sessionKey: number) => _http.get<Position[]>(url.positions(sessionKey)).then(response => response.data),
  labs: async (sessionKey: number) => _http.get<Lap[]>(url.labs(sessionKey)).then(response => response.data),
  pitStops: async (sessionKey: number) => _http.get<PitStop[]>(url.pitStops(sessionKey)),
  drivers: async (sessionKey?: number) => _http.get<Driver[]>(url.driver(sessionKey)).then(response => response.data),
};

export const openF1 = {
  url,
  client,
  api,
} as const;

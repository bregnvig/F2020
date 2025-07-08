import { Driver, Lap, openF1Url, PitStop, Position, Session, TeamRadio, Token } from '@f2020/openf1';
import axios from 'axios';

const _http = axios.create({
  baseURL: 'https://api.openf1.org/v1/',
});

export const openF1Api = {
  session: async (seasonId: string | number, circuitKey: number, sessionName: 'Race' | 'Qualifying' | 'Sprint') => _http.get<Session[]>(openF1Url.session(seasonId, circuitKey, sessionName))
    .then(response => response.data)
    .then(sessions => sessions[0]),
  positions: async (sessionKey: number) => _http.get<Position[]>(openF1Url.positions(sessionKey)).then(response => response.data),
  labs: async (sessionKey: number) => _http.get<Lap[]>(openF1Url.labs(sessionKey)).then(response => response.data),
  pitStops: async (sessionKey: number) => _http.get<PitStop[]>(openF1Url.pitStops(sessionKey)),
  drivers: async (sessionKey?: number) => _http.get<Driver[]>(openF1Url.driver(sessionKey)).then(response => response.data),
  radio: async (sessionKey?: number) => _http.get<TeamRadio[]>(openF1Url.radio(sessionKey)).then(response => response.data),
  token: async (username: string, password: string) => {
    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);
    return _http.post<Token>(openF1Url.token(), body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }).then(response => response.data);
  }
};

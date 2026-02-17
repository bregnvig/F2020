import { Driver, DriverChampionship, GridPosition, Lap, openF1Url, PitStop, Position, Session, SessionResult, TeamChampionship, TeamRadio, Token } from '@f2020/openf1';
import axios, { AxiosHeaders } from 'axios';
import { requiredValue } from '@f2020/tools';

const _http = axios.create({
  baseURL: 'https://api.openf1.org/v1/',
});

const getHeaders = (token: string) => {
  return {
    headers: new AxiosHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }),
  };
};

export const openF1Api = {
  session: async (token: string, seasonId: string | number, circuitKey: number, sessionName: 'Race' | 'Qualifying' | 'Sprint') => _http.get<Session[]>(openF1Url.session(seasonId, circuitKey, sessionName), getHeaders(token))
    .then(response => response.data)
    .then(sessions => sessions[0]),

  sessionResults: async (token: string, sessionKey: number) => _http.get<SessionResult[]>(openF1Url.sessionResults(sessionKey), getHeaders(token)).then(response => response.data),
  championDriverPoints: async (token: string, sessionKey: number) => _http.get<DriverChampionship[]>(openF1Url.championshipDrivers(sessionKey), getHeaders(token)).then(response => response.data),
  championTeamsPoints: async (token: string, sessionKey: number) => _http.get<TeamChampionship[]>(openF1Url.championshipTeams(sessionKey), getHeaders(token)).then(response => response.data),
  startingGrid: async (token: string, sessionKey: number) => _http.get<GridPosition[]>(openF1Url.startingGrid(sessionKey), getHeaders(token)).then(response => response.data),
  positions: async (token: string, sessionKey: number) => _http.get<Position[]>(openF1Url.positions(sessionKey), getHeaders(token)).then(response => response.data),
  labs: async (token: string, sessionKey: number) => _http.get<Lap[]>(openF1Url.labs(sessionKey), getHeaders(token)).then(response => response.data),
  pitStops: async (token: string, sessionKey: number) => _http.get<PitStop[]>(openF1Url.pitStops(sessionKey), getHeaders(token)),
  drivers: async (token: string, sessionKey?: number) => _http.get<Driver[]>(openF1Url.driver(sessionKey), getHeaders(token)).then(response => response.data),
  radio: async (token: string, sessionKey?: number) => _http.get<TeamRadio[]>(openF1Url.radio(sessionKey), getHeaders(token)).then(response => response.data),
  token: async (username: string = requiredValue(process.env.OPEN_F1_USERNAME, 'OPEN_F1_USERNAME'), password: string = requiredValue(process.env.OPEN_F1_PASSWORD, 'OPEN_F1_PASSWORD')) => {
    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);
    return _http.post<Token>(openF1Url.token(), body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).then(response => response.data);
  },
};

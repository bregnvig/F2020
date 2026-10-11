import { Driver, DriverChampionship, GridPosition, Lap, openF1Url, PitStop, Position, Session, SessionResult, TeamChampionship, TeamRadio, Token } from '@f2020/openf1';
import { requiredValue } from '@f2020/tools';

const request = async <T>(url: string, init: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`OpenF1 request failed with status ${response.status} ${response.statusText}: ${url}`);
  }
  return response.json() as Promise<T>;
};

const get = <T>(url: string, token: string) => request<T>(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export const openF1Api = {
  session: async (token: string, seasonId: string | number, circuitKey: number, sessionName: 'Race' | 'Qualifying' | 'Sprint') => get<Session[]>(openF1Url.session(seasonId, circuitKey, sessionName), token)
    .then(sessions => sessions[0]),

  sessionResults: async (token: string, sessionKey: number) => get<SessionResult[]>(openF1Url.sessionResults(sessionKey), token),
  championDriverPoints: async (token: string, sessionKey: number) => get<DriverChampionship[]>(openF1Url.championshipDrivers(sessionKey), token),
  championTeamsPoints: async (token: string, sessionKey: number) => get<TeamChampionship[]>(openF1Url.championshipTeams(sessionKey), token),
  startingGrid: async (token: string, sessionKey: number) => get<GridPosition[]>(openF1Url.startingGrid(sessionKey), token),
  positions: async (token: string, sessionKey: number) => get<Position[]>(openF1Url.positions(sessionKey), token),
  labs: async (token: string, sessionKey: number) => get<Lap[]>(openF1Url.labs(sessionKey), token),
  pitStops: async (token: string, sessionKey: number) => get<PitStop[]>(openF1Url.pitStops(sessionKey), token),
  drivers: async (token: string, sessionKey?: number) => get<Driver[]>(openF1Url.driver(sessionKey), token),
  radio: async (token: string, sessionKey?: number) => get<TeamRadio[]>(openF1Url.radio(sessionKey), token),
  token: async (username: string = requiredValue(process.env.OPEN_F1_USERNAME, 'OPEN_F1_USERNAME'), password: string = requiredValue(process.env.OPEN_F1_PASSWORD, 'OPEN_F1_PASSWORD')) => {
    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);
    return request<Token>(openF1Url.token(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  },
};

const openF1ApiUrl = 'https://api.openf1.org/v1/';
let cachedToken: { token: string; expires: number } | undefined;

/** The token lasts an hour, so it is reused until a minute before it expires */
export const serverToken = async (): Promise<string> => {
  if (!cachedToken || cachedToken.expires < Date.now() + 60_000) {
    const token = await openF1Api.token();
    cachedToken = { token: token.access_token, expires: Date.now() + parseInt(token.expires_in) * 1000 };
  }
  return cachedToken.token;
};

const tooManyRequests = 429;
const retries = 4;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Every player's requests use the same token, so they share OpenF1's rate limit, and a page fetching a lot at once can go over it.
 * A request that is refused for that is tried again, after the time OpenF1 asks for or a little longer each time
 */
const fetchWithRetry = async (path: string, attempt = 0): Promise<Response> => {
  const response = await fetch(openF1ApiUrl + path, {
    headers: {
      'Authorization': `Bearer ${await serverToken()}`,
      'Accept': 'application/json',
    },
  });
  if (response.status !== tooManyRequests || attempt >= retries) {
    return response;
  }
  const retryAfter = Number(response.headers.get('retry-after'));
  await sleep(retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt + Math.random() * 250);
  return fetchWithRetry(path, attempt + 1);
};

/**
 * Gets a list from the OpenF1 REST API, e.g. `laps?session_key=9161`. OpenF1 answers 404 when it has no data, which is an empty list
 */
export const openF1List = async <T>(path: string): Promise<T[]> => {
  const response = await fetchWithRetry(path);
  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error(`OpenF1 request failed with status ${response.status} ${response.statusText}: ${path}`);
  }
  return response.json() as Promise<T[]>;
};

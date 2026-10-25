import { Bid, Player, Role } from '@f2020/data';
import { getFirestore } from 'firebase-admin/firestore';
import { DateTime } from 'luxon';
import { collectionPaths, documentPaths } from '../lib/paths';

export const seasonId = 9999;

const player = (uid: string, displayName: string, roles: Role[], balance: number): Player => ({
  uid,
  displayName,
  roles,
  balance,
  email: `${uid}@example.com`,
  photoURL: `https://example.com/${uid}.png`,
});

export const players = {
  admin: player('admin-uid', 'Admin', ['player', 'admin'], 100),
  player: player('player-uid', 'Player', ['player'], 200),
  player1: player('player1-uid', 'Player 1', ['player'], 200),
  bookie: player('bookie-uid', 'Bookie', ['bookie'], 0),
  bankAdmin: player('bank-admin-uid', 'Bank Admin', ['bank-admin'], 0),
};

export const drivers = ['ver', 'had', 'nor', 'pia', 'lec', 'ham', 'rus', 'ant', 'alo', 'str', 'gas', 'col', 'alb', 'sai', 'hul', 'bor', 'oco', 'bea', 'law', 'lin'];

export const team = { constructorId: 'mercedes', name: 'Mercedes', drivers: ['rus', 'ant'] };

const race = (round: number, name: string, countryCode: string) => ({
  season: seasonId,
  round,
  name,
  countryCode,
  location: { lat: 0, lng: 0, country: name, locality: name },
  state: 'waiting',
  open: DateTime.local().minus({ days: 2 }).toJSDate(),
  close: DateTime.local().plus({ days: 1 }).toJSDate(),
  raceStart: DateTime.local().plus({ days: 2 }).toJSDate(),
  drivers,
  selectedDriver: 'alo',
});

export const races = [race(1, 'Azerbaijan Grand Prix', 'AZ'), race(2, 'Austrian Grand Prix', 'AT')];

/** Ranked by the first result, where the admin's bid is perfect. The second result is the other way around */
export const results: Bid[] = [
  {
    qualify: ['ver', 'had', 'nor', 'pia', 'lec', 'ham', 'rus'],
    podium: ['ver', 'had', 'nor', 'pia'],
    fastestDriver: ['ver', 'had'],
    firstCrash: ['str', 'gas'],
    slowestPitStop: ['col', 'alb'],
    selectedDriver: { grid: 5, finish: 4 },
    polePositionTime: 80_000,
  },
  {
    qualify: ['had', 'ver', 'pia', 'nor', 'ham', 'ant', 'lec'],
    podium: ['had', 'ver', 'pia', 'nor'],
    fastestDriver: ['had', 'ver'],
    firstCrash: ['gas', 'str'],
    slowestPitStop: ['alb', 'col'],
    selectedDriver: { grid: 7, finish: 6 },
    polePositionTime: 81_000,
  },
];

/**
 * The admin's bid is the first result, which gives 31 points: qualify 6 × 2, podium 3 × 2, fastest driver 2, first crash 3,
 * slowest pit stop 2 and the selected driver 3 + 3. It gives 14 points with the second result
 */
const adminBid: Bid = {
  qualify: ['ver', 'had', 'nor', 'pia', 'lec', 'ham'],
  podium: ['ver', 'had', 'nor'],
  fastestDriver: ['ver'],
  firstCrash: ['str'],
  slowestPitStop: ['col'],
  selectedDriver: { grid: 5, finish: 4 },
  polePositionTime: 80_000,
  player: players.admin,
};

/** The player's bid is the second result, so it is the other way around */
const playerBid: Bid = {
  qualify: ['had', 'ver', 'pia', 'nor', 'ham', 'ant'],
  podium: ['had', 'ver', 'pia'],
  fastestDriver: ['had'],
  firstCrash: ['gas'],
  slowestPitStop: ['alb'],
  selectedDriver: { grid: 7, finish: 6 },
  polePositionTime: 81_000,
  player: players.player,
};

/** No points with either result */
const player1Bid: Bid = {
  qualify: ['alo', 'sai', 'hul', 'bor', 'oco', 'bea'],
  podium: ['alo', 'sai', 'hul'],
  fastestDriver: ['law'],
  firstCrash: ['lin'],
  slowestPitStop: ['oco'],
  selectedDriver: { grid: 15, finish: 15 },
  polePositionTime: 100_000,
  player: players.player1,
};

export const bids = { admin: adminBid, player: playerBid, player1: player1Bid };

/** A copy, so a test can change it */
export const clone = <T>(value: T): T => structuredClone(value);

const db = () => getFirestore();

export const writePlayers = (...uids: (keyof typeof players)[]) => Promise.all(uids.map(uid => db().doc(documentPaths.player(players[uid].uid)).set(players[uid])));

export const writeSeason = (season: Record<string, unknown> = {}) =>
  db()
    .doc(documentPaths.season(seasonId))
    .set({
      id: `${seasonId}`,
      name: `${seasonId}`,
      current: true,
      wbc: { latestWBCJoinDate: DateTime.local().plus({ days: 1 }).toJSDate() },
      ...season,
    });

export const writeRace = (round: number, race: Record<string, unknown> = {}) =>
  db()
    .doc(documentPaths.race(seasonId, round))
    .set({ ...races.find(r => r.round === round), ...race });

export const updatePlayer = (uid: string, player: Partial<Player>) => db().doc(documentPaths.player(uid)).update(player);

export const writeTeam = () =>
  db()
    .doc(documentPaths.team(`${seasonId}`, team.constructorId))
    .set(team);

export const writeBid = (round: number, bid: Partial<Bid>) =>
  db()
    .doc(documentPaths.bid(seasonId, round, bid.player!.uid))
    .set(bid);

export const readPlayer = (uid: string) =>
  db()
    .doc(documentPaths.player(uid))
    .get()
    .then(snapshot => snapshot.data() as Player);

export const readRace = (round: number) =>
  db()
    .doc(documentPaths.race(seasonId, round))
    .get()
    .then(snapshot => snapshot.data()!);

export const readBid = (round: number, uid: string) =>
  db()
    .doc(documentPaths.bid(seasonId, round, uid))
    .get()
    .then(snapshot => snapshot.data() as Bid);

export const readSeason = () =>
  db()
    .doc(documentPaths.season(seasonId))
    .get()
    .then(snapshot => snapshot.data()!);

/** The money transactions, without the date */
export const readTransactions = () =>
  db()
    .collection('transactions')
    .get()
    .then(snapshot => snapshot.docs.map(doc => Object.fromEntries(Object.entries(doc.data()).filter(([key]) => key !== 'date'))));

export const readMails = () =>
  db()
    .collection('mail')
    .get()
    .then(snapshot => snapshot.docs.map(doc => doc.data()));

export const racesPath = collectionPaths.races(seasonId);

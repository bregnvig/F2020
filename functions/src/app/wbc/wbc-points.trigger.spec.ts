import { assertSucceeds } from '@firebase/testing';
import { playersURL, seasonsURL } from '../../lib/collection-names';
import { WBC } from '../../lib/model';
import { collections } from '../../test-utils';
import { adminApp, authedApp, clearFirestoreData } from '../../test-utils/firestore-test-utils';
import { WBCPlayer } from './../../lib/model/wbc.model';

const clone = require('clone');

describe('WBC points', () => {

  let adminFirestore: firebase.firestore.Firestore;

  // const readBid = async (uid: string): Promise<Bid> => adminFirestore.doc(`${seasonsURL}/9999/races/${collections.races[1].location.country}/bids/${uid}`).get().then(ref => ref.data() as Bid);
  const writeBid = async (bid: any, uid: string, raceId: string) => adminFirestore.doc(`${seasonsURL}/9999/races/${raceId}/bids/${uid}`).set(bid);
  const byUid = (uid: string) => (wp: WBCPlayer): boolean => wp.player.uid === uid;
  const readWBC = async (): Promise<WBC> => adminFirestore.doc(`${seasonsURL}/9999`).get().then(ref => ref.data()!.wbc as WBC);

  beforeEach(async () => {
    adminFirestore = adminApp();
    await adminFirestore.doc(`${playersURL}/${collections.players.admin.uid}`).set({ ...collections.players.admin });
    await adminFirestore.doc(`${playersURL}/${collections.players.player.uid}`).set({ ...collections.players.player });
    await adminFirestore.doc(`${playersURL}/${collections.players.player1.uid}`).set({ ...collections.players.player1 });
    await adminFirestore.doc(`${playersURL}/${collections.players.bookie.uid}`).set({ ...collections.players.bookie });

    await adminFirestore.doc(`${seasonsURL}/9999`).set(collections.seasons[0]);
    await adminFirestore.doc(`${seasonsURL}/9999/races/${collections.races[1].location.country}`).set({ ...collections.races[1], state: 'closed' });
  });

  afterEach(async () => {
    await clearFirestoreData();
  })

  it('should add player entry to the wbc of the season', async () => {
    await writeBid({ ...clone(collections.bids[0]), submitted: true }, collections.players.admin.uid, collections.races[1].location.country);
    await writeBid({ ...clone(collections.bids[1]), submitted: true }, collections.players.player.uid, collections.races[1].location.country);

    const app = await authedApp({ uid: collections.players.admin.uid });
    await assertSucceeds(app.functions.httpsCallable('submitResult')(collections.results[1]))
      .then(() => new Promise(resolve => setTimeout(() => resolve(), 2000)))
      .then(() => readWBC())
      .then((wbc: WBC) => {
        expect(wbc.length).toEqual(1);
        expect(wbc[0].race.name).toEqual('Azerbaijan Grand Prix');
        const admin: WBCPlayer = wbc[0].players[1];
        expect(admin).toBeTruthy();
        expect(admin.points).toBeTruthy();
        expect(admin.points).toEqual(18);
        expect(admin.player.uid).toEqual(collections.players.admin.uid)
        const player = wbc[0].players[0];
        expect(player).toBeTruthy();
        expect(player.points).toBeTruthy();
        expect(player.points).toEqual(25);
        expect(player.player.uid).toEqual(collections.players.player.uid)
      })

    await adminFirestore.doc(`${seasonsURL}/9999/races/${collections.races[0].location.country}`).set({ ...collections.races[0], state: 'closed' });
    await writeBid({ ...clone(collections.bids[0]), submitted: true }, collections.players.admin.uid, collections.races[0].location.country);
    await writeBid({ ...clone(collections.bids[1]), submitted: true }, collections.players.player.uid, collections.races[0].location.country);

    await assertSucceeds(app.functions.httpsCallable('submitResult')(collections.results[0]))
      .then(() => new Promise(resolve => setTimeout(() => resolve(), 2000)))
      .then(() => readWBC())
      .then((wbc: WBC) => {
        expect(wbc.length).toEqual(2);
        expect(wbc[1]).toBeTruthy();
        expect(wbc[1].race.name).toEqual('Austrian Grand Prix');
        const admin = wbc[1].players[0];
        expect(admin).toBeTruthy();
        expect(admin.points).toBeTruthy();
        expect(admin.points).toEqual(25);
        expect(admin.player.uid).toEqual(collections.players.admin.uid)
        const player = wbc[1].players[1];
        expect(player).toBeTruthy();
        expect(player.points).toBeTruthy();
        expect(player.points).toEqual(18);
        expect(player.player.uid).toEqual(collections.players.player.uid)
      });
  });

  it('should award WBC based on pole time, if points are equal', async () => {
    await writeBid({ ...clone(collections.bids[0]), submitted: true }, collections.players.admin.uid, collections.races[1].location.country);
    await writeBid({
      ...clone(collections.bids[0]),
      player: collections.players.player,
      polePositionTime: collections.results[0].polePositionTime,
      submitted: true
    },
      collections.players.player.uid,
      collections.races[1].location.country);

    const app = await authedApp({ uid: collections.players.admin.uid });
    await assertSucceeds(app.functions.httpsCallable('submitResult')(collections.results[0]))
      .then(() => new Promise(resolve => setTimeout(() => resolve(), 2000)))
      .then(() => readWBC())
      .then((wbc: WBC) => {
        expect(wbc.length).toEqual(1);
        expect(wbc[0]).toBeTruthy();
        expect(wbc[0].race.name).toEqual('Azerbaijan Grand Prix');
        const admin = wbc[0].players[1];
        expect(admin).toBeTruthy();
        expect(admin.points).toBeTruthy();
        expect(admin.points).toEqual(18);
        expect(admin.player.uid).toEqual(collections.players.admin.uid)
        const player = wbc[0].players.find(byUid(collections.players.player.uid))!;
        expect(player).toBeTruthy();
        expect(player.points).toBeTruthy();
        expect(player.points).toEqual(25);
        expect(player.player.uid).toEqual(collections.players.player.uid)
      })
  });

  it('should not include not submitted bids', async () => {
    await writeBid({ ...clone(collections.bids[0]), submitted: true }, collections.players.admin.uid, collections.races[1].location.country);
    await writeBid({ ...clone(collections.bids[1]), submitted: true }, collections.players.player.uid, collections.races[1].location.country);
    await writeBid({ ...clone(collections.bids[1]) }, collections.players.player1.uid, collections.races[1].location.country);

    const app = await authedApp({ uid: collections.players.admin.uid });
    await assertSucceeds(app.functions.httpsCallable('submitResult')(collections.results[0]))
      .then(() => new Promise(resolve => setTimeout(() => resolve(), 2000)))
      .then(() => readWBC())
      .then((wbc: WBC) => {
        expect(wbc.length).toEqual(1);
        expect(wbc[0].players.length).toBe(2)
      })
  });

  it('should only include bids that got some points', async () => {
    await writeBid({ ...clone(collections.bids[0]), submitted: true }, collections.players.admin.uid, collections.races[1].location.country);
    await writeBid({ ...clone(collections.bids[1]), submitted: true }, collections.players.player.uid, collections.races[1].location.country);
    await writeBid({ ...clone(collections.bids[2]), submitted: true }, collections.players.player1.uid, collections.races[1].location.country);

    const app = await authedApp({ uid: collections.players.admin.uid });
    await assertSucceeds(app.functions.httpsCallable('submitResult')(collections.results[1]))
      .then(() => new Promise(resolve => setTimeout(() => resolve(), 2000)))
      .then(() => readWBC())
      .then((wbc: WBC) => {
        expect(wbc.length).toEqual(1);
        expect(wbc[0].players.length).toBe(2)
      })
  });

});

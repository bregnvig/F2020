import { getFirestore } from 'firebase-admin/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { documentPaths } from '../../lib';
import { updateAndTrigger } from '../../test/functions';
import { seasonId, writeRace, writeSeason } from '../../test/fixtures';
import { openF1Drivers } from '../../test/openf1';
import { updateDriversCollection } from './drivers.trigger';

vi.mock('../../lib/openf1.api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../lib/openf1.api')>()),
  openF1Api: {
    token: async () => ({ access_token: 'token' }),
    drivers: async () => openF1Drivers,
  },
}));

const setState = (state: string) => updateAndTrigger(updateDriversCollection, 'seasons/{seasonId}/races/{round}', documentPaths.race(seasonId, 1), { state });

const readDriver = (driverId: string) =>
  getFirestore()
    .doc(documentPaths.driver(driverId))
    .get()
    .then(snapshot => snapshot.data());

describe('update the drivers collection', () => {
  beforeEach(async () => {
    await writeSeason();
    await writeRace(1, { state: 'closed' });
  });

  it('should store the drivers from OpenF1, when the race is completed', async () => {
    await setState('completed');
    expect(await readDriver('lec')).toMatchObject({
      driverId: 'lec',
      code: 'LEC',
      countryCode: 'MC',
      teamName: 'Ferrari',
      permanentNumbers: [16],
      activeNumber: 16,
    });
    const drivers = await getFirestore().collection('drivers').get();
    expect(drivers.size).toBe(openF1Drivers.length);
  });

  it('should keep the numbers a driver has had before', async () => {
    await getFirestore()
      .doc(documentPaths.driver('ham'))
      .set({ driverId: 'ham', code: 'HAM', permanentNumbers: [44, 1], wins: 105 });
    await setState('completed');
    expect(await readDriver('ham')).toMatchObject({ permanentNumbers: [44, 1], activeNumber: 44, wins: 105, teamName: 'Ferrari' });
  });

  it('should add a new number to the numbers of the driver', async () => {
    await getFirestore()
      .doc(documentPaths.driver('rus'))
      .set({ driverId: 'rus', code: 'RUS', permanentNumbers: [1] });
    await setState('completed');
    expect(await readDriver('rus')).toMatchObject({ permanentNumbers: [1, 63], activeNumber: 63 });
  });

  it('should do nothing, when the race is not completed from closed', async () => {
    await writeRace(1, { state: 'waiting' });
    await setState('open');
    expect((await getFirestore().collection('drivers').get()).empty).toBe(true);
  });
});

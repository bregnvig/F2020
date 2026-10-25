import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { beforeEach, describe, it } from 'vitest';
import { players, writePlayers, writeRace } from '../../test/fixtures';
import { rulesTestEnvironment } from '../../test/rules';

const firestoreAs = rulesTestEnvironment();
const race = 'seasons/9999/races/1';

describe('race rules', () => {
  beforeEach(async () => {
    await writePlayers('admin', 'player', 'bookie', 'bankAdmin');
    await writeRace(1);
  });

  it('should let an admin read and change races', async () => {
    const db = firestoreAs(players.admin.uid);
    await assertSucceeds(db.doc(race).get());
    await assertSucceeds(db.doc(race).update({ state: 'open' }));
  });

  it('should let a player read races, but not change them', async () => {
    const db = firestoreAs(players.player.uid);
    await assertSucceeds(db.doc(race).get());
    await assertFails(db.doc(race).update({ state: 'open' }));
  });

  it.each([
    ['bookie', players.bookie.uid],
    ['bank admin', players.bankAdmin.uid],
    ['non-player', 'non-player-uid'],
  ])('should not let a %s read or change races', async (_, uid) => {
    const db = firestoreAs(uid);
    await assertFails(db.doc(race).get());
    await assertFails(db.doc(race).update({ state: 'open' }));
  });
});

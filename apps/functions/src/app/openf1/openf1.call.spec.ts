import { openF1Url } from '@f2020/openf1';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { call, expectError } from '../../test/functions';
import { players, writePlayers } from '../../test/fixtures';
import { openF1Call } from './openf1.call';

const openF1List = vi.fn();

vi.mock('../../lib/openf1.api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../lib/openf1.api')>()),
  openF1List: (path: string) => openF1List(path),
}));

const openF1 = (path: string, uid = players.player.uid) => call(openF1Call, { path }, uid);

describe('openF1 call', () => {
  beforeEach(async () => {
    openF1List.mockReset();
    openF1List.mockResolvedValue([]);
    await writePlayers('player', 'bookie');
  });

  it('should deny the call, when the user is not a player', async () => {
    await expectError(openF1('position?session_key=9161', players.bookie.uid), 'permission-denied');
  });

  it('should fetch an endpoint with a query', async () => {
    await openF1('position?session_key=9161&date<=2026-05-03T23:00:00');
    expect(openF1List).toHaveBeenCalledWith('position?session_key=9161&date<=2026-05-03T23:00:00');
  });

  it('should fetch a session, whose name has a space', async () => {
    const path = openF1Url.session(2026, 65, 'Practice 3').replace('https://api.openf1.org/v1/', '');
    await openF1(path);
    expect(openF1List).toHaveBeenCalledWith('sessions?year=2026&circuit_key=65&session_name=Practice%203');
  });

  it('should deny a path that is not an endpoint with a query', async () => {
    await expectError(openF1('https://example.com/?a=1'), 'invalid-argument');
    expect(openF1List).not.toHaveBeenCalled();
  });
});

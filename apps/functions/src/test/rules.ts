import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll } from 'vitest';
import { emulatorHost, projectId } from './emulator';

/**
 * The Firestore of a logged in user, which goes through the rules of apps/firebase/firestore.rules.
 * The data is written with the admin SDK of the tests, which is not limited by the rules
 */
export const rulesTestEnvironment = () => {
  let environment: RulesTestEnvironment;
  const [host, port] = emulatorHost.split(':');

  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId,
      firestore: { host, port: +port, rules: readFileSync(join(import.meta.dirname, '../../../firebase/firestore.rules'), 'utf8') },
    });
  });

  afterAll(() => environment.cleanup());

  return (uid: string) => environment.authenticatedContext(uid).firestore();
};

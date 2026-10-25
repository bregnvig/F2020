import { DocumentSnapshot, getFirestore } from 'firebase-admin/firestore';
import { CloudFunction } from 'firebase-functions/v2';
import { FirestoreEvent } from 'firebase-functions/v2/firestore';
import { CallableFunction, CallableRequest } from 'firebase-functions/v2/https';
import { expect } from 'vitest';

/** Calls a callable function in the test, as the player with the uid, or without anyone logged in */
export const call = <T, R>(fn: CallableFunction<T, R>, data?: T, uid?: string): Promise<R> =>
  Promise.resolve(fn.run({ data, auth: uid ? { uid, token: { uid } } : undefined, rawRequest: {} } as unknown as CallableRequest<T>) as R);

/** Expects the call to fail with the HttpsError code, e.g. 'not-found' */
export const expectError = (promise: Promise<unknown>, code: string) => expect(promise).rejects.toMatchObject({ code });

/** The params of a document path, e.g. seasons/{seasonId}/races/{round} with seasons/2026/races/3 is { seasonId: '2026', round: '3' } */
const params = (pattern: string, path: string) =>
  Object.fromEntries(
    pattern
      .split('/')
      .map((part, index) => [part, path.split('/')[index]])
      .filter(([part]) => part.startsWith('{'))
      .map(([part, value]) => [part.slice(1, -1), value]),
  );

const event = <T>(pattern: string, path: string, data: T) => ({ data, params: params(pattern, path) }) as unknown as FirestoreEvent<T>;

/**
 * Updates the document, and runs the onDocumentUpdated trigger with the change, as Firestore would
 * @param pattern The path of the trigger, e.g. seasons/{seasonId}/races/{round}
 */
export const updateAndTrigger = async <T>(fn: CloudFunction<FirestoreEvent<T>>, pattern: string, path: string, update: Record<string, unknown>) => {
  const doc = getFirestore().doc(path);
  const before = await doc.get();
  await doc.update(update);
  const after = await doc.get();
  return fn.run(event(pattern, path, { before, after } as T));
};

/** Runs the onDocumentCreated trigger with the document, as Firestore would */
export const createdTrigger = async <T>(fn: CloudFunction<FirestoreEvent<T>>, pattern: string, snapshot: DocumentSnapshot) =>
  fn.run(event(pattern, snapshot.ref.path, snapshot as T));

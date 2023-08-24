
import { WrappedScheduledFunction, WrappedFunction } from 'firebase-functions-test/lib/v1';
import { EventContext } from 'firebase-functions/v1';

export const initFirebaseTestEnv = async (projectId = `dummy_${new Date().getTime()}`) => {
  // initialize test FirestoreDatabase
  process.env['GCLOUD_PROJECT'] = projectId;
  process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';

  const app = await import('firebase-admin').then(admin => admin.initializeApp({ projectId }));
  const firestore = app.firestore(); // Used for querying the database
  const firebaseTest = await import('firebase-functions-test').then(functions => functions()); // used for wrapping and cleaning up

  return { firebaseTest, firestore };
};

export type WrappedFirebaseFunction<T extends (...args: any) => any> = WrappedScheduledFunction | WrappedFunction<Awaited<ReturnType<T>>>;

export const mockEventContext = (uidOrPartialEventContext: string | (Partial<EventContext & { uid: Partial<EventContext['auth']>; }>)): EventContext =>
  (typeof uidOrPartialEventContext === 'string' ? { auth: { uid: uidOrPartialEventContext } } : uidOrPartialEventContext) as EventContext;

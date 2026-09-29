import { cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { environment } from '../environment/environment';

const app = (function () {
  console.log('Initializing Firebase'); //, environment.firebase);
  return initializeApp({
    credential: cert(<ServiceAccount>environment.firebase),
  });
})();

const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });
export const firebaseApp = {
  get database(): Firestore {
    return db;
  },
};

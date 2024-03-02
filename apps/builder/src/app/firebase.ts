import * as admin from 'firebase-admin';
import { environment } from '../environment/environment';

const app: admin.app.App = (function() {
  console.log('Initializing Firebase', environment.firebaseURL, environment.firebase);
  return admin.initializeApp({
    credential: admin.credential.cert(<any>environment.firebase),
    databaseURL: environment.firebaseURL,
  });
})();

const db = app.firestore();
db.settings({ ignoreUndefinedProperties: true });
export const firebaseApp = {
  get datebase(): admin.firestore.Firestore {
    return db;
  },
};

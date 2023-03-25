import * as admin from 'firebase-admin';
import { environment } from '../environments/environment';

const app: admin.app.App = (function () {
  return admin.initializeApp({
    credential: admin.credential.cert(<any>environment.firebase),
    databaseURL: 'https://f1-serverless.firebaseio.com',
  });
})();

const db = app.firestore();
db.settings({ ignoreUndefinedProperties: true });
export const firebaseApp = {
  get datebase(): admin.firestore.Firestore {
    return db;
  }
};

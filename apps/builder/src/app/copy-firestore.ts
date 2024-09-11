import { lstatSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { readCollection } from "./write-document";

import { firestore } from 'firebase-admin';
import { firebaseApp } from './firebase';
const plainCollections = [
  'players',
  'drivers',
  'transactions',
];

const seasont = {
  races: (seasonId: number) => `seasons/${seasonId}/races`,
  raceBids: (seasonId: number, round: number) => `seasons/${seasonId}/races/${round}/bids`,
  raceParticipants: (seasonId: number, round: number) => `seasons/${seasonId}/races/${round}/participants`,
  teams: (seasonId: number) => `seasons/${seasonId}/teams`,
  lastYear: (seasonId: number) => `seasons/${seasonId}/lastYear`,
  standings: (seasonId: number) => `seasons/${seasonId}/standings`,
  standingDrivers: (seasonId: number) => `seasons/${seasonId}/standings/drivers/${seasonId}`,
  previousStandingDrivers: (seasonId: number) => `seasons/${seasonId}/standings/drivers/${seasonId - 1}`,
};

const seasonCollections = (seasonId: number) => [
  `seasons/${seasonId}/teams`,
  `seasons/${seasonId}/lastYear`,
  `seasons/${seasonId}/standings`,
  `seasons/${seasonId}/standings/drivers/${seasonId}`,
  `seasons/${seasonId}/standings/drivers/${seasonId - 1}`,
];


export const backupFirestore = async (): Promise<any> => {

  await Promise.all(plainCollections.map(collection => readCollection(collection).then(_ => JSON.stringify(_, null, '\t')).then(data => writeFileSync(`firestore-backup/${collection}.json`, data))));

  const seasons = await readCollection('seasons');
  console.log(seasons.map(s => s.id));

  await Promise.all(
    seasons.map(season => Promise.all(seasonCollections(season.id).map(collection => readCollection(collection).then(_ => JSON.stringify(_, null, '\t')).then(data => writeFileSync(`firestore-backup/${collection.replaceAll('/', '-')}.json`, data)))))
  );

  return Promise.all(seasons.map(async season => {

    const races = await readCollection(`seasons/${season.id}/races`);
    writeFileSync(`firestore-backup/seasons-${season.id}-races.json`, JSON.stringify(races, null, '\t'));
    return Promise.all(races.map(async ({ id }) => {
      const bids = await readCollection(`seasons/${season.id}/races/${id}/bids`);
      writeFileSync(`firestore-backup/seasons-${season.id}-races-bids-${id}.json`, JSON.stringify(bids, null, '\t'));
      const participants = await readCollection(`seasons/${season.id}/races/${id}/participants`);
      writeFileSync(`firestore-backup/seasons-${season.id}-races-participants-${id}.json`, JSON.stringify(participants, null, '\t'));
    }));

  }));

};


function convertTimestampsInPlace(obj) {
  function traverse(currentObj) {
    for (const key in currentObj) {
      if (
        typeof currentObj[key] === "object" &&
        currentObj[key] !== null &&
        "_seconds" in currentObj[key] &&
        "_nanoseconds" in currentObj[key]
      ) {
        // Convert to Firestore Timestamp in-place
        currentObj[key] = new firestore.Timestamp(
          currentObj[key]._seconds,
          currentObj[key]._nanoseconds
        );
      } else if (typeof currentObj[key] === "object") {
        traverse(currentObj[key]);
      }
    }
  }

  traverse(obj);
  return obj; // Return the modified object
}

export const writeFirestore = async (): Promise<any> => {

  const files = readdirSync('firestore-backup');
  const seasonIds = [...new Set(files
    .map(f => /seasons-(\d{4})/.exec(f)?.[1])
    .filter(Boolean)
    .map(Number)
    .sort()
  )];

  return Promise.all(plainCollections.map(async collection => {
    const documents = readFileDocuments(`firestore-backup/${collection}.json`);
    await writeDocuments(collection, documents).then(() => console.log(`Wrote ${collection}`));
  }));
};


const readFileDocuments = (path: string): any[] => {
  return convertTimestampsInPlace(JSON.parse(readFileSync(path, 'utf-8')));
};

const writeDocuments = async (collection: string, documents: any[]) => {
  const db = firebaseApp.database;
  const collectionRef = db.collection(collection + '_backup');

  return db.runTransaction(transaction => {
    documents
      .forEach(driver =>
        transaction.set(collectionRef.doc(driver.id), driver),
      );
    return Promise.resolve(documents.length);
  });
};


const isFile = fileName => {
  return lstatSync(fileName).isFile();
};

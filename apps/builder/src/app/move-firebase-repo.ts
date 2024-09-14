import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { readCollection } from './write-document';

import { firestore } from 'firebase-admin';
import { firebaseApp } from './firebase';

const plainCollections = [
  'players',
  'drivers',
  'transactions',
];

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

  seasons.forEach(data => writeFileSync(`firestore-backup/season-${data.id}.json`, JSON.stringify(data, null, '\t')));
  await Promise.all(seasons.map(season => Promise.all(seasonCollections(season.id).map(collection => readCollection(collection).then(_ => JSON.stringify(_, null, '\t')).then(data => writeFileSync(`firestore-backup/${collection.replaceAll('/', '-')}.json`, data))))),
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
        typeof currentObj[key] === 'object' &&
        currentObj[key] !== null &&
        '_seconds' in currentObj[key] &&
        '_nanoseconds' in currentObj[key]
      ) {
        // Convert to Firestore Timestamp in-place
        currentObj[key] = new firestore.Timestamp(
          currentObj[key]._seconds,
          currentObj[key]._nanoseconds,
        );
      } else if (typeof currentObj[key] === 'object') {
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
    .sort(),
  )];

  console.log(`Found seasons`, seasonIds.join(', '));

  const plain = Promise.all(plainCollections.map(async collection => {
    const documents = readFileDocuments(`firestore-backup/${collection}.json`);
    collection === 'players' && documents.forEach(d => d.data = { ...d.data, tokens: [] });
    await writeDocuments(collection, documents).then(() => console.log(`Wrote ${collection}`));
  }));


  const seasons = Promise.all(seasonIds.map(async seasonId => {
    const season = readFileDocuments(`firestore-backup/season-${seasonId}.json`);
    await writeDocuments('seasons', [season]).then(() => console.log(`Wrote season ${seasonId}`));
    const races = readFileDocuments(`firestore-backup/seasons-${seasonId}-races.json`);
    await writeDocuments(`seasons/${seasonId}/races`, races).then(() => console.log(`Wrote season ${seasonId} races`));
    const bidFiles = files.filter(f => f.includes(`seasons-${seasonId}-races-bids-`));
    const participantsFiles = files.filter(f => f.includes(`seasons-${seasonId}-races-participants-`));

    return [
      ...bidFiles.map(async file => {
        const documents = readFileDocuments(`firestore-backup/${file}`);
        const round = parseInt(/(\d+)\.json/.exec(file)?.[1]);
        return writeDocuments(`seasons/${seasonId}/races/${round}/bids`, documents).then(() => console.log(`Wrote bids ${seasonId} round ${round}`));
      }),
      ...participantsFiles.map(async file => {
        const documents = readFileDocuments(`firestore-backup/${file}`);
        const round = parseInt(/(\d+)\.json/.exec(file)?.[1]);
        return writeDocuments(`seasons/${seasonId}/races/${round}/participants`, documents).then(() => console.log(`Wrote participants ${seasonId} round ${round}`));
      }),
      ...seasonCollections(seasonId).map(async collection => {
        const documents = readFileDocuments(`firestore-backup/${collection.replaceAll('/', '-')}.json`);
        await writeDocuments(collection, documents).then(() => console.log(`Wrote ${collection}`));
      }),
    ];
  }));
  return Promise.all([
    plain,
    seasons,
  ]);
};

const readFileDocuments = (path: string): any[] => {
  return convertTimestampsInPlace(JSON.parse(readFileSync(path, 'utf-8')));
};

const writeDocuments = async (collection: string, documents: any[]) => {
  const db = firebaseApp.database;
  const collectionRef = db.collection(collection);

  return db.runTransaction(transaction => {
    documents
      .forEach(document =>
        transaction.set(collectionRef.doc(document.id), document.data),
      );
    return Promise.resolve(documents.length);
  });
};

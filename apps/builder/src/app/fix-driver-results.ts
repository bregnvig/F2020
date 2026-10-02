import { driverResult, IDriverResult } from '@f2020/data';
import { firebaseApp } from './firebase';

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * The result function used to append rounds with arrayUnion, so a re-run round could be stored twice. The last one wins.
 */
const uniqueRounds = <T extends { round: number }>(items: T[]): T[] =>
  [...items.reduce((acc, item) => acc.set(item.round, item), new Map<number, T>()).values()].sort((a, b) => a.round - b.round);

/**
 * Recalculates seasons/{seasonId}/standings/drivers/{seasonId}/{driverId} from the races and qualifyings already
 * stored on each document. Duplicated rounds are removed, and retired and the average positions are recalculated.
 *
 * Nothing is written unless `write` is true.
 */
export const fixDriverResults = async (seasonId: number, write: boolean) => {
  const db = firebaseApp.database;
  const path = `seasons/${seasonId}/standings/drivers/${seasonId}`;
  const docs = await db.collection(path).get().then(snapshot => snapshot.docs);
  if (!docs.length) {
    console.log(`No driver results in ${path}`);
    return;
  }

  const fixed = docs.map(doc => {
    const current = doc.data() as IDriverResult;
    return { doc, current, result: driverResult(uniqueRounds(current.races ?? []), uniqueRounds(current.qualify ?? [])) };
  });

  console.table(
    fixed.map(({ doc, current, result }) => ({
      driver: doc.id,
      races: `${current.races?.length ?? 0} → ${result.races.length}`,
      retired: `${current.retired ?? 0} → ${result.retired}`,
      averageFinish: `${round(current.averageFinishPosition ?? 0)} → ${round(result.averageFinishPosition)}`,
      averageGrid: `${round(current.averageGridPosition ?? 0)} → ${round(result.averageGridPosition)}`,
    })),
  );

  if (write) {
    const batch = db.batch();
    fixed.forEach(({ doc, result }) => batch.set(doc.ref, result, { merge: true }));
    await batch.commit();
    console.log(`Wrote ${fixed.length} driver results to ${path}`);
  } else {
    console.log(`Dry run. Pass --write to write ${fixed.length} driver results to ${path}`);
  }
};

import { IQualifyResult, IRaceResult, mapper } from '@f2020/data';
import { getQualifyResults, getRaceResults } from '@f2020/ergast';
import { firestoreUtils } from './converter/firestore-utils';
import { firebaseApp } from './firebase';

export const buildPreviousRaceReult = async (seasonId: number) => {

  const results: IRaceResult[] = await (await getRaceResults(seasonId.toString())).map(mapper.raceResult);
  const qualification: IQualifyResult[] = await (await getQualifyResults(seasonId.toString())).map(mapper.qualifyResult);

  Promise.all(results.map((result, index) => {
    const concat = {
      result,
      qualify: qualification[index]
    };
    return firebaseApp.datebase.doc(`seasons/${seasonId + 1}/lastYear/${result.countryCode}`).set(firestoreUtils.convertDateTimes(concat));
  }));

}
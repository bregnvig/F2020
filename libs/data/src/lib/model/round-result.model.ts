import { IQualifyResult, IRaceResult } from './race.model';

export interface RoundResult {
  result: IRaceResult;
  qualify: IQualifyResult;
}

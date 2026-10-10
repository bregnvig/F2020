import { ILiveQualifyResult, IDriver, IRace } from '@f2020/data';
import { Observable } from 'rxjs';
import { LiveSessionService, LiveStatus } from './race-result.service';

export abstract class QualifyResultService extends LiveSessionService {
  abstract readonly resultStatus: Observable<LiveStatus>;

  abstract getResult(race: IRace, drivers: IDriver[]): Observable<ILiveQualifyResult>;
}

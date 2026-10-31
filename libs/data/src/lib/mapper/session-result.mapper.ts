import { Driver, SessionResult } from '@f2020/openf1';
import { filterUndefined, isTruthy } from '@f2020/tools';
import { IDriver, IDriverSessionResult, IRaceSession, ISessionResult } from '../model';
import { driver } from './driver.mapper';

export interface OpenF1SessionResultParams {
  session: IRaceSession;
  sessionResults: SessionResult[];
  /** The drivers of the session */
  drivers: Driver[];
}

/** A qualifying has a value for each part. The last part the driver was in is used */
const lastPart = <T>(value: T | T[] | undefined | null): T | undefined => (Array.isArray(value) ? value.toReversed().find(isTruthy) : (value ?? undefined));

const milliseconds = (seconds: number | undefined) => (seconds === undefined ? undefined : Math.round(seconds * 1000));

const status = (result: SessionResult): IDriverSessionResult['status'] => (result.dsq ? 'dsq' : result.dns ? 'dns' : result.dnf ? 'dnf' : undefined);

export const map = ({ session, sessionResults, drivers }: OpenF1SessionResultParams): ISessionResult => ({
  session,
  results: sessionResults
    .map(result => {
      const openF1Driver = drivers.find(d => d.driver_number === result.driver_number);
      if (!openF1Driver) {
        console.warn(`Session result: no driver with number ${result.driver_number}. Skipped`);
        return undefined;
      }
      const gap = lastPart(result.gap_to_leader);
      return filterUndefined<IDriverSessionResult>({
        driver: filterUndefined<IDriver>(driver(openF1Driver)),
        position: result.position ?? undefined,
        laps: result.number_of_laps ?? 0,
        duration: milliseconds(lastPart(result.duration)),
        gapToLeader: typeof gap === 'number' ? milliseconds(gap) : (gap ?? undefined),
        status: status(result),
      });
    })
    .filter(isTruthy)
    .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)),
});

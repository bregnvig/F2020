import { Lap, Position, RaceControl } from '@f2020/openf1';
import { isTruthy } from '@f2020/tools';
import { DateTime } from 'luxon';
import { IDriver, ILiveDriverQualifying, ILiveQualifyResult, IRaceBasis, QualifyPhase } from '../model';
import { findDriver, getDrivers } from './mapper-utils';

interface OpenF1LiveQualifyParams {
  positions: Position[];
  laps: Lap[];
  raceControl: RaceControl[];
  drivers: IDriver[];
  race: IRaceBasis;
}

/** E.g. "CAR 87 (BEA) TIME 1:39.780 DELETED - TRACK LIMITS AT TURN 15 LAP 6 16:14:25" */
const deletedTime = /^CAR (\d+) .*TIME [\d:.]+ DELETED.* LAP (\d+)/;

/** Live updates have their dates converted, the history from the HTTP API does not */
const toDateTime = (date: string | DateTime): DateTime => DateTime.isDateTime(date) ? date : DateTime.fromISO(date);

const lapKey = (driverNumber: number, lapNumber: number) => `${driverNumber}-${lapNumber}`;

const openF1Map = (source: OpenF1LiveQualifyParams): ILiveQualifyResult => {
  const drivers = getDrivers(source.drivers);
  // OpenF1 has no qualifying phase on the status messages of Q1 in some sessions
  const sessionStatus = source.raceControl
    .filter(message => message.category === 'SessionStatus')
    .map(message => ({ ...message, phase: message.qualifying_phase || 1 }));
  // The first start of each part. A part that is resumed after a red flag is started again
  const phaseStarts = sessionStatus
    .filter(message => message.message === 'SESSION STARTED')
    .reduce((starts, message) => starts.has(message.phase) ? starts : starts.set(message.phase, toDateTime(message.date)), new Map<number, DateTime>());
  const phase = Math.max(1, ...phaseStarts.keys()) as QualifyPhase;
  const phaseFinished = sessionStatus.findLast(message => message.phase === phase)?.message === 'SESSION FINISHED';

  const deletedLaps = new Set(source.raceControl
    .map(message => deletedTime.exec(message.message))
    .filter(isTruthy)
    .map(([, driverNumber, lapNumber]) => lapKey(+driverNumber, +lapNumber)));
  const phaseOf = (lap: Lap): QualifyPhase => {
    const start = toDateTime(lap.date_start);
    return ([3, 2] as QualifyPhase[]).find(p => phaseStarts.has(p) && phaseStarts.get(p)! <= start) ?? 1;
  };

  // A lap that ends in the pit lane is not timed. It is the lap before the next out lap
  const inLaps = new Set(source.laps
    .filter(lap => lap.is_pit_out_lap)
    .map(lap => lapKey(lap.driver_number, lap.lap_number - 1)));
  const isTimed = (lap: Lap) => {
    const key = lapKey(lap.driver_number, lap.lap_number);
    return lap.lap_duration && lap.date_start && !lap.is_pit_out_lap && !inLaps.has(key) && !deletedLaps.has(key);
  };

  // The best lap of each driver in each part, in milliseconds
  const bestLaps = source.laps
    .filter(isTimed)
    .reduce((best, lap) => {
      const times = best.get(lap.driver_number) ?? [];
      const index = phaseOf(lap) - 1;
      const time = lap.lap_duration! * 1000;
      times[index] = Math.min(times[index] ?? Number.MAX_SAFE_INTEGER, time);
      return best.set(lap.driver_number, times);
    }, new Map<number, number[]>());

  const positions = source.positions.reduce((latest, position) => latest.set(position.driver_number, position.position), new Map<number, number>());
  const driverNumbers = [...new Set([...positions.keys(), ...bestLaps.keys()])].toSorted((a, b) =>
    (positions.get(a) ?? Number.MAX_SAFE_INTEGER) - (positions.get(b) ?? Number.MAX_SAFE_INTEGER),
  );

  // 20 cars knock out 5 in Q1 and Q2, 22 cars knock out 6
  const knockedOutPerPhase = Math.floor((driverNumbers.length - 10) / 2);
  const throughQ1 = driverNumbers.length - knockedOutPerPhase;
  const knockedOutIn = (position: number): 1 | 2 | undefined => {
    if (phase >= 2 && position > throughQ1) return 1;
    if (phase >= 3 && position > 10) return 2;
    return undefined;
  };

  const results = driverNumbers
    .map((driverNumber, index) => {
      const driver = findDriver(drivers, driverNumber, `Live qualify ${source.race.name}`);
      if (!driver) return undefined;
      const position = positions.get(driverNumber) ?? index + 1;
      const times = bestLaps.get(driverNumber) ?? [];
      const out = knockedOutIn(position);
      return {
        driver,
        position,
        q1: times[0],
        q2: times[1],
        q3: times[2],
        knockedOutIn: out,
        duration: times[(out ?? phase) - 1],
      } as ILiveDriverQualifying;
    })
    .filter(isTruthy);

  // The gap is to the fastest driver in the same part, so the drivers knocked out in Q1 are compared on their Q1 times
  const fastest = results.reduce((acc, result) => {
    const key = result.knockedOutIn ?? phase;
    result.duration && acc.set(key, Math.min(acc.get(key) ?? Number.MAX_SAFE_INTEGER, result.duration));
    return acc;
  }, new Map<number, number>());

  return {
    ...source.race,
    phase,
    phaseFinished,
    results: results.map(result => ({
      ...result,
      gap: result.duration ? result.duration - fastest.get(result.knockedOutIn ?? phase)! : undefined,
    })),
  };
};

export function map(source: OpenF1LiveQualifyParams): ILiveQualifyResult {
  return openF1Map(source);
}

import { RaceControl as OpenF1RaceControl } from '@f2020/openf1';
import { DateTime } from 'luxon';
import { IDriver, RaceControl } from '../model';
import { getDrivers } from './mapper-utils';

interface OpenF1RaceControlParams {
  drivers: IDriver[];
  messages: OpenF1RaceControl[];
}

const openF1Map = (source: OpenF1RaceControlParams): RaceControl[] => {
  const drivers = getDrivers(source.drivers);

  return source.messages.map(message => {
    const driver = message.driver_number
      ? drivers.get(message.driver_number)
      : undefined;

    return {
      category: message.category,
      date: DateTime.fromISO(message.date),
      driver,
      flag: message.flag,
      lapNumber: message.lap_number || undefined,
      message: message.message,
      scope: message.scope,
      sector: message.sector || undefined,
    } as RaceControl;
  });
};

export function map(source: OpenF1RaceControlParams): RaceControl[] {
  return openF1Map(source);
}

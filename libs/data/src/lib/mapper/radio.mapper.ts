import { IDriver, TeamRadio } from '../model';
import { TeamRadio as OpenF1TeamRadio } from '@f2020/openf1';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { findDriver, getDrivers } from './mapper-utils';

export interface OpenF1TeamRadioParams {
  drivers: IDriver[];
  messages: OpenF1TeamRadio[];
}

export const map = (source: OpenF1TeamRadioParams): TeamRadio[] => {
  const drivers = getDrivers(source.drivers);
  return source.messages.flatMap(message => {
    const driver = findDriver(drivers, message.driver_number, 'Team radio');
    return driver ? [{ metaId: v4(), driver, date: DateTime.fromISO(message.date), recordingUrl: message.recording_url }] : [];
  });
};

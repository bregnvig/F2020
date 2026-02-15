import { IDriver, TeamRadio } from '../model';
import { TeamRadio as OpenF1TeamRadio } from '@f2020/openf1';
import { requiredValue } from '@f2020/tools';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { getDrivers } from './mapper-utils';

export interface OpenF1TeamRadioParams {
  drivers: IDriver[];
  messages: OpenF1TeamRadio[];
}

export const map = (source: OpenF1TeamRadioParams): TeamRadio[] => {
  const drivers = getDrivers(source.drivers);
  return source.messages.map(message => {
    const driver = requiredValue(drivers.get(message.driver_number), 'Driver with driver number', message.driver_number);
    return {
      metaId: v4(),
      driver,
      date: DateTime.fromISO(message.date),
      recordingUrl: message.recording_url,
    };
  });
};

import { DateTime } from 'luxon';
import { IDriver } from './driver.model';

export interface TeamRadio {
  metaId: string;
  driver: IDriver;
  date: DateTime;
  recordingUrl: string;
}

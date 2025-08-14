import { DateTime } from 'luxon';
import { IDriver } from './driver.model';

export interface RaceControl {
  category: string;
  date: DateTime;
  driver?: IDriver;
  flag: string;
  lapNumber?: number;
  message: string;
  scope: string;
  sector?: number;
}

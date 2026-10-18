import { DateTime } from 'luxon';

/** The weather at the track, which OpenF1 measures about once a minute */
export interface IWeatherReading {
  date: DateTime;
  /** °C */
  airTemperature: number;
  /** °C */
  trackTemperature: number;
  /** % */
  humidity: number;
  /** hPa */
  pressure: number;
  rainfall: boolean;
  /** Where the wind comes from, in degrees from north */
  windDirection: number;
  /** m/s */
  windSpeed: number;
}

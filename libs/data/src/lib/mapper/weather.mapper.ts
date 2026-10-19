import { Weather } from '@f2020/openf1';
import { DateTime } from 'luxon';
import { IWeatherReading } from '../model/weather.model';

export interface OpenF1WeatherParams {
  weather: Weather[];
}

/** Live updates have their dates converted, the history from the HTTP API does not */
const toDateTime = (date: string | DateTime) => (DateTime.isDateTime(date) ? date : DateTime.fromISO(date));

/** The readings, the oldest first */
export const map = ({ weather }: OpenF1WeatherParams): IWeatherReading[] =>
  weather
    // The sensor sometimes gives a track temperature of 0, and no race is driven on a track that cold
    .filter(reading => reading.track_temperature > 0)
    .map(reading => ({
      date: toDateTime(reading.date as string | DateTime),
      airTemperature: reading.air_temperature,
      trackTemperature: reading.track_temperature,
      humidity: reading.humidity,
      pressure: reading.pressure,
      rainfall: reading.rainfall > 0,
      windDirection: reading.wind_direction,
      windSpeed: reading.wind_speed,
    }))
    .toSorted((a, b) => a.date.toMillis() - b.date.toMillis());

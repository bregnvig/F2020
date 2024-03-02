import { HttpClient } from '@angular/common/http';
import { effect, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { CoordinateModel } from '@f2020/data';
import { DateTime } from 'luxon';
import { map } from 'rxjs/operators';
import { RacesStore } from '../race/+state';

const weatherURL = (coordinate: CoordinateModel) => `https://api.openweathermap.org/data/2.5/forecast/daily?cnt=16&mode=json&units=metric&lang=da&APPID=89ad11753c4d9dfd5d597ca8829cb331&lat=${coordinate.lat}&lon=${coordinate.lng}`;

interface OpenWeatherDay {
  dt: number;
  temp: {
    day: number;
  };
  weather: {
    icon: string;
    description: string;
  }[];
}

export interface WeatherDay {
  date: DateTime;
  temp: number;
  icon: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class WeatherService {

  #weather: WritableSignal<WeatherDay[]> = signal([]);

  constructor(private store: RacesStore, http: HttpClient) {
    effect(() => {
      const race = store.currentRace();
      if (race) {
        http.get<any>(weatherURL(race.location)).pipe(
          map(response => response.list as OpenWeatherDay[]),
          map((days: OpenWeatherDay[]) => days.map(day => <WeatherDay>({
            date: DateTime.fromMillis(day.dt * 1000),
            temp: day.temp.day,
            icon: `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`,
            description: day.weather[0].description,
          }))),
        ).subscribe(days => {
          const daysInvolved = [race.close.startOf('day'), race.close.startOf('day').plus({ day: 1 }), race.close.startOf('day').plus({ day: 2 })];
          this.#weather.set(days.filter(day => daysInvolved.some(i => Math.floor(day.date.diff(i, 'days').days) === 0)));
        });
      }
    });
  }

  get weather(): Signal<WeatherDay[]> {
    return this.#weather;
  }
}

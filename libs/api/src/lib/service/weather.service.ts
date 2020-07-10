import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RacesFacade } from '../race/+state';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap, filter } from 'rxjs/operators';
import { CoordinateModel } from '@f2020/data';
import { DateTime } from 'luxon';
import { truthy } from '@f2020/tools';

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
  providedIn: 'root'
})
export class WeatherService {

  readonly weather$: Observable<any>;

  constructor(private facade: RacesFacade, http: HttpClient) {
    const weather$ = this.facade.currentRace$.pipe(
      truthy(),
      map(race => weatherURL(race.location)),
      switchMap(url => http.get<any>(url)),
      map(weather => weather.list),
      map((days: OpenWeatherDay[]) => days.map(day => <WeatherDay>({
        date: DateTime.fromMillis(day.dt * 1000),
        temp: day.temp.day,
        icon: `https://api.openweathermap.org/img/w/${day.weather[0].icon}.png`,
        description: day.weather[0].description
      }))),
    );
    this.weather$ = combineLatest([
      this.facade.currentRace$,
      weather$
    ]).pipe(
      map(([race, days]) => {
        const dayIndex = days.findIndex(day => Math.floor(day.date.diff(race.close, 'days').days) === 0);
        const fallback = days.length - 4;
        const index = dayIndex ?? fallback;
        return days.slice(index, index + 3);
      })
    );
  }


}
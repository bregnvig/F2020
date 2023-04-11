import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CoordinateModel } from '@f2020/data';
import { truthy } from '@f2020/tools';
import { DateTime } from 'luxon';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { RacesFacade } from '../race/+state';

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

  readonly weather$: Observable<WeatherDay[]>;

  constructor(private facade: RacesFacade, http: HttpClient) {
    const weather$ = this.facade.currentRace$.pipe(
      truthy(),
      map(race => weatherURL(race.location)),
      switchMap(url => http.get<any>(url)),
      map(weather => weather.list),
      map((days: OpenWeatherDay[]) => days.map(day => <WeatherDay>({
        date: DateTime.fromMillis(day.dt * 1000),
        temp: day.temp.day,
        icon: `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`,
        description: day.weather[0].description
      }))),
    );
    this.weather$ = combineLatest([
      this.facade.currentRace$.pipe(truthy()),
      weather$
    ]).pipe(
      map(([race, days]) => {
        const daysInvolved = [race.close.startOf('day'), race.close.startOf('day').plus({ day: 1 }), race.close.startOf('day').plus({ day: 2 })];
        return days.filter(day => daysInvolved.some(i => Math.floor(day.date.diff(i, 'days').days) === 0));
      })
    );
  }


}
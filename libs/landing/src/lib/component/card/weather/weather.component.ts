import { Observable } from 'rxjs';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { WeatherService, WeatherDay } from '@f2020/api';
import { icon } from '@f2020/shared';

@Component({
  selector: 'f2020-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeatherComponent implements OnInit {

  icon = icon.farWeather;
  days$: Observable<WeatherDay[]>;

  constructor(private service: WeatherService) { }

  ngOnInit(): void {
    this.days$ = this.service.weather$;
  }

}

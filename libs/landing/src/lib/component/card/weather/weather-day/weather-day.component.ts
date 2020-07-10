import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { WeatherDay } from '@f2020/api';

@Component({
  selector: 'f2020-weather-day',
  templateUrl: './weather-day.component.html',
  styleUrls: ['./weather-day.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeatherDayComponent {

  @Input() day: WeatherDay;

}

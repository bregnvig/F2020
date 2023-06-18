import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { WeatherDay } from '@f2020/api';
import { DateTimePipe } from '@f2020/shared';
import { DecimalPipe, NgOptimizedImage, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'f2020-weather-day',
  template: `
    <div class="flex flex-row md:flex-col justify-center items-center">
      <div class="flex-auto">{{day.date | dateTime: 'EEEE' | titlecase}}</div>
      <div><img width="100" height="100" [ngSrc]="day.icon" [alt]="day.description"></div>
      <div>{{day.temp | number: '0.0-0'}}° og {{day.description}}</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [DecimalPipe, TitleCasePipe, DateTimePipe, NgOptimizedImage],
})
export class WeatherDayComponent {

  @Input() day: WeatherDay;

}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { WeatherDay } from '@f2020/api';

@Component({
  selector: 'f2020-weather-day',
  template: `
  <div fxLayout fxLayout.xs="row" fxLayout.sm="column"  fxLayoutAlign="space-between center">
    <div fxFlex>{{day.date | dateTime: 'EEEE' | titlecase}}</div>
    <div><img [src]="day.icon"></div>
    <div>{{day.temp | number: '0.0-0'}}° og {{day.description}}</div>
  </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeatherDayComponent {

  @Input() day: WeatherDay;

}

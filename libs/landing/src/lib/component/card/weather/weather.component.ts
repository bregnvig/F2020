import { ChangeDetectionStrategy, Component, effect, HostBinding, Signal } from '@angular/core';
import { WeatherDay, WeatherService } from '@f2020/api';
import { icon } from '@f2020/shared';
import { WeatherDayComponent } from './weather-day/weather-day.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'f2020-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatCardModule, FontAwesomeModule, WeatherDayComponent, AsyncPipe],
})
export class WeatherComponent {

  @HostBinding('hidden') isHidden = true;
  icon = icon.farWeather;
  days: Signal<WeatherDay[]> = this.service.weather;

  constructor(private service: WeatherService) {
    effect(() => this.isHidden = !this.service.weather()?.length);
  }

}

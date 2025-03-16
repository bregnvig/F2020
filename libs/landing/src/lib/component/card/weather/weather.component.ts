import { ChangeDetectionStrategy, Component, effect, HostBinding, inject, Signal } from '@angular/core';
import { WeatherDay, WeatherService } from '@f2020/api';
import { icon } from '@f2020/shared';
import { WeatherDayComponent } from './weather-day/weather-day.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'f2020-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, FaIconComponent, WeatherDayComponent],
})
export class WeatherComponent {

  #service = inject(WeatherService);
  @HostBinding('hidden') isHidden = true;
  icon = icon.farWeather;
  days: Signal<WeatherDay[]> = this.#service.weather;

  constructor() {
    effect(() => this.isHidden = !this.#service.weather()?.length);
  }

}

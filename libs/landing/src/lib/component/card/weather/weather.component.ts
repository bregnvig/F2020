import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { WeatherDay, WeatherService } from '@f2020/api';
import { icon } from '@f2020/shared';
import { WeatherDayComponent } from './weather-day/weather-day.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'f2020-weather',
  template: `
    @if (days()) {
      <mat-card>
        <mat-card-header>
          <fa-icon mat-card-avatar [icon]="icon" size="2x"></fa-icon>
          <mat-card-title>Vejret</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="flex flex-col md:flex-row md:justify-around">
            @for (day of days(); track day) {
              <div>
                <f2020-weather-day [day]="day"></f2020-weather-day>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, FaIconComponent, WeatherDayComponent],
  host: {
    '[hidden]': '!days()?.length',
  },
})
export class WeatherComponent {

  icon = icon.farWeather;
  days: Signal<WeatherDay[]> = inject(WeatherService).weather;

}

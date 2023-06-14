import { ChangeDetectionStrategy, Component, HostBinding, OnInit } from '@angular/core';
import { WeatherDay, WeatherService } from '@f2020/api';
import { icon } from '@f2020/shared';
import { Observable, first } from 'rxjs';
import { WeatherDayComponent } from './weather-day/weather-day.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';

@Component({
    selector: 'f2020-weather',
    templateUrl: './weather.component.html',
    styleUrls: ['./weather.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgIf, MatCardModule, FontAwesomeModule, NgFor, WeatherDayComponent, AsyncPipe]
})
export class WeatherComponent implements OnInit {

  @HostBinding('hidden') isHidden = true;
  icon = icon.farWeather;
  days$: Observable<WeatherDay[]>;

  constructor(private service: WeatherService) { }

  ngOnInit(): void {
    this.days$ = this.service.weather$;
    this.days$.pipe(first()).subscribe(days => this.isHidden = !days.length);
  }

}

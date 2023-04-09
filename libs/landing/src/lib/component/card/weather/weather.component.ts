import { ChangeDetectionStrategy, Component, HostBinding, OnInit } from '@angular/core';
import { WeatherDay, WeatherService } from '@f2020/api';
import { icon } from '@f2020/shared';
import { Observable, first } from 'rxjs';

@Component({
  selector: 'f2020-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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

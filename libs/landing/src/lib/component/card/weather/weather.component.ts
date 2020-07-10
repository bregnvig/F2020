import { Observable } from 'rxjs';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { WeatherService, WeatherDay } from '@f2020/api';

@Component({
  selector: 'f2020-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeatherComponent implements OnInit {

  days$: Observable<WeatherDay[]>;

  constructor(private service: WeatherService) { }

  ngOnInit(): void {
    this.days$ = this.service.weather$;
  }

}

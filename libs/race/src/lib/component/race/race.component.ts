import { AsyncPipe, NgIf, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { RacesActions, RacesFacade } from '@f2020/api';
import { Bid, IRace } from '@f2020/data';
import { CardPageComponent, DateTimePipe, FlagURLPipe, HasRoleDirective, LoadingComponent, icon } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DateTime } from 'luxon';
import { Observable, combineLatest } from 'rxjs';
import { debounceTime, filter, first, map } from 'rxjs/operators';
import { BidsComponent } from '../bids/bids.component';
import { RaceUpdatedWarningComponent } from './race-updated-warning.component';

@Component({
  selector: 'f2020-race',
  styleUrls: ['./race.component.scss'],
  templateUrl: './race.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf, CardPageComponent, MatCardModule, GoogleMapsModule, MatButtonModule, RouterLink, HasRoleDirective, MatCheckboxModule, BidsComponent, RaceUpdatedWarningComponent, MatIconModule, LoadingComponent, AsyncPipe, FlagURLPipe, DateTimePipe, NgOptimizedImage, FontAwesomeModule],
})
export class RaceComponent implements OnInit {

  downloadIcon = icon.farCloudArrowDown;
  plusIcon = icon.farPlus;

  center$: Observable<google.maps.LatLng>;
  race$: Observable<IRace>;
  play$: Observable<boolean>;
  bids$: Observable<Bid[]>;

  options: google.maps.MapOptions = {
    draggable: true,
    zoomControl: false,
    scrollwheel: false,
    fullscreenControl: false,
    streetViewControl: true,
    mapTypeControl: false,
    zoom: 15,
    mapTypeId: 'roadmap',
  };

  constructor(private facade: RacesFacade) {
  }

  ngOnInit(): void {
    this.facade.dispatch(RacesActions.loadBids());

    this.race$ = this.facade.selectedRace$.pipe(filter(race => !!race));
    this.bids$ = this.facade.bids$;
    this.play$ = combineLatest([
      this.race$,
      this.bids$,
    ]).pipe(
      debounceTime(100),
      map(([race, bids]) => race.close > DateTime.local() && !(bids || []).length),
    );
    this.center$ = this.race$.pipe(
      map(race => new google.maps.LatLng(race.location.lat, race.location.lng)),
    );
  }

  rollbackResult() {
    this.race$.pipe(
      first(),
    ).subscribe(({ round }) => this.facade.dispatch(RacesActions.rollbackResult({ round })));
  }

  cancelRace() {
    this.race$.pipe(
      first(),
    ).subscribe(({ round }) => this.facade.dispatch(RacesActions.cancelRace({ round })));
  }
}

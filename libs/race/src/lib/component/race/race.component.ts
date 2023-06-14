import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RacesActions, RacesFacade } from '@f2020/api';
import { Bid, IRace } from '@f2020/data';
import { Observable, combineLatest } from 'rxjs';
import { debounceTime, filter, first, map } from 'rxjs/operators';
import { DateTimePipe } from '../../../../../shared/src/lib/pipe/date-time.pipe';
import { FlagURLPipe } from '../../../../../shared/src/lib/pipe/flag-url.pipe';
import { LoadingComponent } from '../../../../../shared/src/lib/component/loading/loading.component';
import { MatIconModule } from '@angular/material/icon';
import { RaceUpdatedWarningComponent } from './race-updated-warning.component';
import { BidsComponent } from '../bids/bids.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HasRoleDirective } from '../../../../../shared/src/lib/component/has-role.directive';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatCardModule } from '@angular/material/card';
import { CardPageComponent } from '../../../../../shared/src/lib/component/card-page/card-page.component';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
    selector: 'f2020-race',
    styleUrls: ['./race.component.scss'],
    templateUrl: './race.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgIf, CardPageComponent, MatCardModule, GoogleMapsModule, MatButtonModule, RouterLink, HasRoleDirective, MatCheckboxModule, BidsComponent, RaceUpdatedWarningComponent, MatIconModule, LoadingComponent, AsyncPipe, FlagURLPipe, DateTimePipe]
})
export class RaceComponent implements OnInit {

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
      this.bids$
    ]).pipe(
      debounceTime(100),
      map(([race, bids]) => race.state === 'open' && !(bids || []).length)
    );
    this.center$ = this.race$.pipe(
      map(race => new google.maps.LatLng(race.location.lat, race.location.lng)),
    );
  }

  rollbackResult() {
    this.race$.pipe(
      first()
    ).subscribe(({ round }) => this.facade.dispatch(RacesActions.rollbackResult({ round })));
  }

  cancelRace() {
    this.race$.pipe(
      first()
    ).subscribe(({ round }) => this.facade.dispatch(RacesActions.cancelRace({ round })));
  }
}

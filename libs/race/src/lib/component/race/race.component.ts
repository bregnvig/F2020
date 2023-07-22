import { AsyncPipe, NgIf, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PlayerFacade, RacesActions, RacesFacade } from '@f2020/api';
import { Bid, IRace, Participant } from '@f2020/data';
import { CardPageComponent, DateTimePipe, FlagURLPipe, HasRoleDirective, icon, LoadingComponent } from '@f2020/shared';
import { truthy } from '@f2020/tools';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DateTime } from 'luxon';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, first, map } from 'rxjs/operators';
import { BidsComponent } from '../bids/bids.component';
import { RaceUpdatedWarningComponent } from './updated-warning/race-updated-warning.component';

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
  clickable$: Observable<boolean>;
  bids$: Observable<Bid[] | Participant[]>;

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

  constructor(private facade: RacesFacade, private playerFacade: PlayerFacade) {
  }

  ngOnInit(): void {
    this.race$ = this.facade.selectedRace$.pipe(truthy());
    this.center$ = this.race$.pipe(
      map(race => new google.maps.LatLng(race.location.lat, race.location.lng)),
    );
    this.race$.pipe(
      map(race => DateTime.local() > race.close),
      first(),
    ).subscribe(closed => {
      this.facade.dispatch(closed ? RacesActions.loadBids() : RacesActions.loadParticipants());
      this.bids$ = closed ? this.facade.bids$ : this.facade.participants$;
      this.play$ = combineLatest([
        this.race$,
        this.bids$,
        this.playerFacade.player$,
      ]).pipe(
        debounceTime(100),
        map(([race, bids, player]) => {
          return race.close > DateTime.local()
            && !(bids || []).some(bid => bid.player.uid === player.uid && bid.submitted);
        }),
      );
      this.clickable$ = this.play$.pipe(map(play => !play));
    });
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

import { NgOptimizedImage, UpperCasePipe } from '@angular/common';
import { Component, computed, inject, Signal } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PlayerStore, RaceStore } from '@f2020/api';
import { Bid, IRace, isBid, Participant } from '@f2020/data';
import { CardPageComponent, DateTimePipe, FlagURLPipe, HasRoleDirective, icon, LoadingComponent } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DateTime } from 'luxon';
import { BidsComponent } from '../bids/bids.component';
import { RaceUpdatedWarningComponent } from './updated-warning/race-updated-warning.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { LiveRaceComponent } from './live/live-race.component';

const BaseGoogleMapOptions: google.maps.MapOptions = {
  zoomControl: false,
  scrollwheel: false,
  fullscreenControl: false,
  streetViewControl: true,
  mapTypeControl: false,
  zoom: 15,
  mapTypeId: 'roadmap',
};

@UntilDestroy()
@Component({
    selector: 'f2020-race',
    styleUrls: ['./race.component.scss'],
    templateUrl: './race.component.html',
    imports: [UpperCasePipe, CardPageComponent, MatCardModule, GoogleMapsModule, MatButtonModule, RouterLink, HasRoleDirective, MatCheckboxModule, BidsComponent, RaceUpdatedWarningComponent, MatIconModule, LoadingComponent, FlagURLPipe, DateTimePipe, NgOptimizedImage, FontAwesomeModule, LiveRaceComponent]
})
export class RaceComponent {

  downloadIcon = icon.farCloudArrowDown;
  plusIcon = icon.farPlus;

  private store = inject(RaceStore);

  // center: Signal<google.maps.LatLng | undefined>;
  race: Signal<IRace | undefined>;
  play: Signal<boolean>;
  clickable: Signal<boolean>;
  bids: Signal<(Bid | Participant)[] | undefined>;
  isCompleted = computed(() => this.race().state === 'completed');

  liveBids = computed(() => {
    const bids = this.bids();
    return bids?.filter(bid => isBid(bid)).map(bid => ({ ...bid, points: undefined })) ?? [];
  });
  isLiveLive = computed(() => this.race().raceStart.minus({ hour: 1 }) < DateTime.local() && this.race().raceStart.plus({ hour: 3 }) > DateTime.local());
  relive = false;

  options: Signal<google.maps.MapOptions>;

  constructor() {
    const playerStore = inject(PlayerStore);
    this.race = this.store.race;
    this.options = computed(() => ({ ...BaseGoogleMapOptions, lat: this.race()?.location.lat, lng: this.race()?.location.lng }));
    this.bids = this.store.bids;
    this.play = computed(() => {
      return this.race()?.close > DateTime.local()
        && !(this.bids() ?? []).some(bid => bid.player.uid === playerStore.player()?.uid && bid.submitted);
    });
    this.clickable = computed(() => !this.play());
  }

  rollbackResult() {
    this.store.rollback();
  }

  cancelRace() {
    this.store.cancel();
  }
}

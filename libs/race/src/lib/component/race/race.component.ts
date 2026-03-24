import { NgOptimizedImage, UpperCasePipe } from '@angular/common';
import { Component, computed, inject, Signal } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PlayerStore, RaceStore } from '@f2020/api';
import { Bid, IDriver, IRace, Participant } from '@f2020/data';
import { CardPageComponent, DateTimePipe, FlagURLPipe, HasRoleDirective, icon, LoadingComponent } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DateTime } from 'luxon';
import { BidsComponent } from '../bids/bids.component';
import { RaceUpdatedWarningComponent } from './updated-warning/race-updated-warning.component';
import { UntilDestroy } from '@ngneat/until-destroy';

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
  templateUrl: './race.component.html',
  imports: [UpperCasePipe, CardPageComponent, MatCardModule, GoogleMapsModule, MatButtonModule, RouterLink, HasRoleDirective, MatCheckboxModule, BidsComponent, RaceUpdatedWarningComponent, MatIconModule, LoadingComponent, FlagURLPipe, DateTimePipe, NgOptimizedImage, FaIconComponent],
})
export class RaceComponent {

  downloadIcon = icon.farCloudArrowDown;
  plusIcon = icon.farPlus;

  #store = inject(RaceStore);

  race: Signal<IRace | undefined> = this.#store.race;
  drivers: Signal<IDriver[] | undefined> = this.#store.drivers;
  play: Signal<boolean>;
  clickable: Signal<boolean>;
  bids: Signal<(Bid | Participant)[] | undefined> = this.#store.bids;
  isCompleted = computed(() => this.race().state === 'completed');
  isLiveLive = computed(() => this.race().raceStart.minus({ hour: 1 }) < DateTime.local() && this.race().raceStart.plus({ hour: 3 }) > DateTime.local());
  options: Signal<google.maps.MapOptions>;

  constructor() {
    const playerStore = inject(PlayerStore);
    this.options = computed(() => ({ ...BaseGoogleMapOptions, center: { lat: this.race()?.location.lat, lng: this.race()?.location.lng } }));
    this.play = computed(() => {
      return this.race()?.close > DateTime.local()
        && !(this.bids() ?? []).some(bid => bid.player.uid === playerStore.player()?.uid && bid.submitted);
    });
    this.clickable = computed(() => !this.play());
  }

  rollbackResult() {
    this.#store.rollback();
  }

  updateStandings() {
    this.#store.standings();
  }

  cancelRace() {
    this.#store.cancel();
  }
}

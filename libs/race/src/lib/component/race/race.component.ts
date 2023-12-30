import { AsyncPipe, NgIf, NgOptimizedImage, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal, Signal } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PlayerStore, RacesActions, RacesFacade } from '@f2020/api';
import { Bid, IRace, Participant } from '@f2020/data';
import { CardPageComponent, DateTimePipe, FlagURLPipe, HasRoleDirective, icon, LoadingComponent } from '@f2020/shared';
import { truthy } from '@f2020/tools';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DateTime } from 'luxon';
import { BidsComponent } from '../bids/bids.component';
import { RaceUpdatedWarningComponent } from './updated-warning/race-updated-warning.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'f2020-race',
  styleUrls: ['./race.component.scss'],
  templateUrl: './race.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf, UpperCasePipe, CardPageComponent, MatCardModule, GoogleMapsModule, MatButtonModule, RouterLink, HasRoleDirective, MatCheckboxModule, BidsComponent, RaceUpdatedWarningComponent, MatIconModule, LoadingComponent, AsyncPipe, FlagURLPipe, DateTimePipe, NgOptimizedImage, FontAwesomeModule],
})
export class RaceComponent {

  downloadIcon = icon.farCloudArrowDown;
  plusIcon = icon.farPlus;

  center: Signal<google.maps.LatLng | undefined>;
  race: Signal<IRace | undefined>;
  play: Signal<boolean>;
  clickable: Signal<boolean>;
  bids = signal<Bid[] | Participant[] | undefined>(undefined);

  options: google.maps.MapOptions = {
    zoomControl: false,
    scrollwheel: false,
    fullscreenControl: false,
    streetViewControl: true,
    mapTypeControl: false,
    zoom: 15,
    mapTypeId: 'roadmap',
  };

  constructor(private facade: RacesFacade, playerStore: PlayerStore) {
    this.race = toSignal(this.facade.selectedRace$.pipe(truthy()), { initialValue: undefined });
    this.center = computed(() => this.race() && new google.maps.LatLng(this.race().location.lat, this.race().location.lng));
    const closed = computed(() => DateTime.local() > this.race()?.close);
    effect(() => {
      facade.dispatch(closed() ? RacesActions.loadBids() : RacesActions.loadParticipants());
      (closed() ? this.facade.bids$ : this.facade.participants$).pipe(
        untilDestroyed(this),
      ).subscribe(bids => this.bids.set(bids));
    }, { allowSignalWrites: true });
    this.play = computed(() => {
      return this.race()?.close > DateTime.local()
        && !(this.bids() ?? []).some(bid => bid.player.uid === playerStore.player()?.uid && bid.submitted);
    });
    this.clickable = computed(() => !this.play());
  }

  rollbackResult() {
    this.facade.dispatch(RacesActions.rollbackResult({ round: this.race().round }));
  }

  cancelRace() {
    this.facade.dispatch(RacesActions.cancelRace({ round: this.race().round }));
  }
}

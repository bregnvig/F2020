import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal, Signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute } from '@angular/router';
import { RaceStore } from '@f2020/api';
import { Bid, IRace, Player } from '@f2020/data';
import { CardPageComponent, LoadingComponent } from '@f2020/shared';
import { UntilDestroy } from '@ngneat/until-destroy';
import { PartialBidWarningComponent } from '../../partial-bid-warning/partial-bid-warning.component';
import { DisplayBidComponent } from '../display-bid.component';
import { ComparePlayerBidComponent } from './compare/compare-player-bid.component';
import { ReactiveFormsModule } from '@angular/forms';

@UntilDestroy()
@Component({
  selector: 'f2020-display-player-bid',
  template: `
    @if (bid(); as bid) {
      <mat-toolbar color="primary">
        <img class="avatar" width="40" height="40" [ngSrc]="bid.player.photoURL" alt="Profil billede" />
        <span class="flex-auto">{{ bid.player.displayName }}</span>
        <f2020-partial-bid-warning [bid]="bid"></f2020-partial-bid-warning>
        @if (bid.points !== undefined) {
          {{ bid.points }} point 
        }
      </mat-toolbar>
      @if (race(); as race) {
        <div class="max-width py-3">
          <sha-card-page>
            <div class="flex gap-3">
              <f2020-compare-player-bid class="flex flex-grow" label="Sammenlign med" [players]="players()" (compareWithId)="compareWithId.set($event)" />
            </div>
          </sha-card-page>
          <f2020-display-bid [bidToCompare]="bidToCompare()" [bid]="bid" [race]="race" />
        </div>
      } 
    } @else {
      <sha-loading></sha-loading>
    }
  `,
  imports: [
    MatToolbarModule,
    PartialBidWarningComponent,
    DisplayBidComponent,
    LoadingComponent,
    NgOptimizedImage,
    ComparePlayerBidComponent,
    ReactiveFormsModule,
    CardPageComponent,
  ],
})
export class DisplayPlayerBidComponent {
  bid: Signal<Partial<Bid> | undefined>;
  race: Signal<IRace | undefined>;
  compareWithId = signal<string>('');
  players: Signal<Player[]>;
  bidToCompare: Signal<Partial<Bid>>;

  constructor(route: ActivatedRoute) {
    const store = inject(RaceStore);
    this.race = store.race;
    this.players = computed(() => store.bids()
      .map((bid: Bid) => bid.player)
      .filter(player => player.uid !== this.bid().player.uid));
    this.bid = computed(() => store.bids()?.find((bid: Bid) => bid.player.uid === route.snapshot.params.uid));
    this.bidToCompare = computed(() => store.bids()?.find((bid: Bid) => bid.player.uid === this.compareWithId()));
  }

}

import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, Signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute } from '@angular/router';
import { RaceStore } from '@f2020/api';
import { Bid, IRace } from '@f2020/data';
import { LoadingComponent } from '@f2020/shared';
import { UntilDestroy } from '@ngneat/until-destroy';
import { PartialBidWarningComponent } from '../../partial-bid-warning/partial-bid-warning.component';
import { DisplayBidComponent } from '../display-bid.component';

@UntilDestroy()
@Component({
  selector: 'f2020-display-player-bid',
  template: `
    @if (bid()) {
      <mat-toolbar color="primary">
        <img class="avatar" width="40" height="40" [ngSrc]="bid().player.photoURL" alt="Profil billede">
        <span class="flex-auto">{{ bid().player.displayName }}</span>
        <f2020-partial-bid-warning [bid]="bid()"></f2020-partial-bid-warning>
        @if (bid().points !== undefined) {
          {{ bid().points }} point
        }
      </mat-toolbar>
      @if (bid() && race()) {
        <div class="max-width py-3">
          <f2020-display-bid [bid]="bid()" [race]="race()"></f2020-display-bid>
        </div>
      }
    } @else {
      <sha-loading></sha-loading>
    }
  `,
  imports: [MatToolbarModule, PartialBidWarningComponent, DisplayBidComponent, LoadingComponent, NgOptimizedImage],
})
export class DisplayPlayerBidComponent {

  bid: Signal<Partial<Bid> | undefined>;
  race: Signal<IRace | undefined>;

  constructor(
    route: ActivatedRoute) {
    const store = inject(RaceStore);

    this.race = store.race;
    this.bid = computed(() => store.bids()?.find(bid => bid.player.uid === route.snapshot.params.uid));
  }

}

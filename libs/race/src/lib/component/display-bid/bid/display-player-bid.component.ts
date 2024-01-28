import { AsyncPipe, NgIf, NgOptimizedImage } from '@angular/common';
import { Component, computed, effect, Signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute } from '@angular/router';
import { RacesFacade, RaceStore } from '@f2020/api';
import { Bid, IRace } from '@f2020/data';
import { LoadingComponent } from '@f2020/shared';
import { UntilDestroy } from '@ngneat/until-destroy';
import { PartialBidWarningComponent } from '../../partial-bid-warning/partial-bid-warning.component';
import { DisplayBidComponent } from '../display-bid.component';

@UntilDestroy()
@Component({
  selector: 'f2020-display-player-bid',
  templateUrl: './display-player-bid.component.html',
  styleUrls: ['./display-player-bid.component.scss'],
  standalone: true,
  imports: [NgIf, MatToolbarModule, PartialBidWarningComponent, DisplayBidComponent, LoadingComponent, AsyncPipe, NgOptimizedImage],
})
export class DisplayPlayerBidComponent {

  bidControl = new FormControl({ value: null, disabled: true });
  bid: Signal<Partial<Bid> | undefined>;
  race: Signal<IRace | undefined>;

  constructor(
    store: RaceStore,
    private facade: RacesFacade,
    private route: ActivatedRoute) {
    this.race = store.race;
    this.bid = computed(() => store.bids().find(bid => bid.player.uid === this.route.snapshot.params.uid));
    effect(() => {
      this.bid() && this.bidControl.patchValue(this.bid());
    });
  }

}

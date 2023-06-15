import { AsyncPipe, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute } from '@angular/router';
import { RacesActions, RacesFacade } from '@f2020/api';
import { Bid, IRace } from '@f2020/data';
import { LoadingComponent } from '@f2020/shared';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { PartialBidWarningComponent } from '../../partial-bid-warning/partial-bid-warning.component';
import { DisplayBidComponent } from '../display-bid.component';

@UntilDestroy()
@Component({
  selector: 'f2020-display-player-bid',
  templateUrl: './display-player-bid.component.html',
  styleUrls: ['./display-player-bid.component.scss'],
  standalone: true,
  imports: [NgIf, MatToolbarModule, PartialBidWarningComponent, DisplayBidComponent, LoadingComponent, AsyncPipe]
})
export class DisplayPlayerBidComponent implements OnInit {

  bidControl = new FormControl({ value: null, disabled: true });
  bid$: Observable<Partial<Bid>>;
  race$: Observable<IRace>;

  constructor(
    private facade: RacesFacade,
    private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.route.params.pipe(
      untilDestroyed(this),
    ).subscribe(({ uid }) => {
      this.facade.dispatch(RacesActions.loadBid({ uid }));
    });
    this.race$ = this.facade.selectedRace$;
    this.bid$ = combineLatest([
      this.facade.bid$,
      this.route.params,
    ]).pipe(
      filter(([bid, { uid }]) => bid && bid.player.uid === uid),
      map(([bid]) => bid),
      untilDestroyed(this),
    );
    this.bid$.subscribe(bid => this.bidControl.patchValue(bid));
  }

}

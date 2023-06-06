import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
import { Bid, IRace } from '@f2020/data';
import { RacesFacade, RacesActions } from '@f2020/api';
import { ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'f2020-display-player-bid',
  templateUrl: './display-player-bid.component.html',
  styleUrls: ['./display-player-bid.component.scss']
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

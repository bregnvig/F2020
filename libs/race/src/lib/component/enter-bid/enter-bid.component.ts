import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IRace } from '@f2020/data';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import { debounceTime, filter, pairwise, share, switchMap, tap, switchMapTo } from 'rxjs/operators';
import { RacesFacade, RacesActions } from '@f2020/api';
import { shareLatest } from '@f2020/tools';

@UntilDestroy()
@Component({
  selector: 'f2020-enter-bid',
  templateUrl: './enter-bid.component.html',
  styleUrls: ['./enter-bid.component.scss']
})
export class EnterBidComponent implements OnInit {

  bidControl: FormControl = new FormControl();
  race$: Observable<IRace>;
  updating$: Observable<boolean>;

  constructor(
    private facade: RacesFacade,
    private router: Router,
    private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.facade.dispatch(RacesActions.loadYourBid());
    this.race$ = this.facade.selectedRace$.pipe(
      filter(race => !!race),
      tap(_ => console.log(_)),
      shareLatest(),
    );
    this.updating$ = this.facade.updating$;
    this.facade.yourBid$.pipe(
      filter(bid => bid && !bid.submitted),
      untilDestroyed(this),
    ).subscribe(bid => this.bidControl.patchValue(bid || {}, {emitEvent: false}));
    this.facade.yourBid$.pipe(
      filter(bid => bid && bid.submitted),
      untilDestroyed(this),
    ).subscribe(() => this.bidControl.disable());
    this.bidControl.valueChanges.pipe(
      debounceTime(3000),
      untilDestroyed(this),
      filter(bid => !bid?.submitted)
    ).subscribe(value => this.facade.dispatch(RacesActions.updateYourBid({bid: value})));
    this.updating$.pipe(
      pairwise(),
      filter(([previous, current]) => previous && current === false) ,
      untilDestroyed(this),
      switchMapTo(this.race$)
    ).subscribe(race => this.router.navigate(['race', race.location.country.toLocaleLowerCase()]));
    this.facade.error$.pipe(
      filter(error => !!error),
      untilDestroyed(this)
    ).subscribe(error => this.bidControl.enable({emitEvent: false}));
  }

  submitBid() {
    this.facade.dispatch(RacesActions.submitBid(this.bidControl.value));
    this.bidControl.disable({emitEvent: false});
  }

  isOpen(race: IRace): boolean {
    return race.close >= DateTime.local()
  }
}

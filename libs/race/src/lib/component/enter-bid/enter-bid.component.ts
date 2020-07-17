import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { RacesActions, RacesFacade, TeamService } from '@f2020/api';
import { IRace, ITeam } from '@f2020/data';
import { shareLatest } from '@f2020/tools';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DateTime } from 'luxon';
import { Observable, of } from 'rxjs';
import { debounceTime, filter, first, pairwise, switchMap, switchMapTo, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'f2020-enter-bid',
  templateUrl: './enter-bid.component.html',
  styleUrls: ['./enter-bid.component.scss']
})
export class EnterBidComponent implements OnInit {

  bidControl: FormControl = new FormControl();
  race$: Observable<IRace>;
  team$: Observable<ITeam | null>;
  updating$: Observable<boolean>;

  constructor(
    private facade: RacesFacade,
    private teamService: TeamService,
    private router: Router) {
  }

  ngOnInit(): void {
    this.facade.dispatch(RacesActions.loadYourBid());
    this.race$ = this.facade.selectedRace$.pipe(
      filter(race => !!race),
      tap(_ => console.log(_)),
      shareLatest(),
    );
    this.team$ = this.race$.pipe(
      switchMap(race => race.selectedTeam ? this.teamService.getTeam(race.selectedTeam) : of(null))
    );

    this.updating$ = this.facade.updating$;
    this.facade.yourBid$.pipe(
      filter(bid => bid && !bid.submitted),
      first(),
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
    ).subscribe(race => this.router.navigate(['race', race.round]));
    this.facade.error$.pipe(
      filter(error => !!error),
      untilDestroyed(this)
    ).subscribe(error => this.bidControl.enable({emitEvent: false}));
  }

  submitBid() {
    this.facade.dispatch(RacesActions.submitBid({bid: this.bidControl.value}));
    this.bidControl.disable({emitEvent: false});
  }

  isOpen(race: IRace): boolean {
    return race.close >= DateTime.local()
  }
}

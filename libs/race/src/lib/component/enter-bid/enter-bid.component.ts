import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { RacesActions, RacesFacade, TeamService } from '@f2020/api';
import { IRace, ITeam } from '@f2020/data';
import { icon } from '@f2020/shared';
import { shareLatest } from '@f2020/tools';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import { debounceTime, filter, first, pairwise, switchMap, tap } from 'rxjs/operators';

@UntilDestroy({ arrayName: 'subscriptions' })
@Component({
  selector: 'f2020-enter-bid',
  templateUrl: './enter-bid.component.html',
  styleUrls: ['./enter-bid.component.scss']
})
export class EnterBidComponent implements OnInit {

  bidControl: FormControl = new FormControl();
  race$: Observable<IRace>;
  teams$: Observable<ITeam[]>;
  updating$: Observable<boolean>;
  editIcon = icon.farPen;

  private subscriptions = [];

  constructor(
    private facade: RacesFacade,
    private teamsService: TeamService,
    private router: Router) {
  }

  ngOnInit(): void {
    this.facade.dispatch(RacesActions.loadYourBid());
    this.race$ = this.facade.selectedRace$.pipe(
      filter(race => !!race),
      tap(_ => console.log(_)),
      shareLatest(),
    );

    this.teams$ = this.teamsService.teams$;
    this.updating$ = this.facade.updating$;
    this.subscriptions.push(
      this.facade.yourBid$.pipe(
        filter(bid => bid && !bid.submitted),
        first(),
      ).subscribe(bid => this.bidControl.patchValue(bid || {}, { emitEvent: false })),
      this.facade.yourBid$.pipe(
        filter(bid => bid && bid.submitted),
      ).subscribe(() => this.bidControl.disable()),
      this.bidControl.valueChanges.pipe(
        debounceTime(3000),
        filter(bid => !bid?.submitted),
      ).subscribe(value => this.facade.dispatch(RacesActions.updateYourBid({ bid: value }))),
      this.updating$.pipe(
        pairwise(),
        filter(([previous, current]) => previous && current === false),
        switchMap(() => this.race$),
      ).subscribe(race => this.router.navigate([race.season, 'race', race.round])),
      this.facade.error$.pipe(
        filter(error => !!error),
      ).subscribe(error => this.bidControl.enable({ emitEvent: false }))
    );
  }

  submitBid() {
    this.facade.dispatch(RacesActions.submitBid({ bid: this.bidControl.value }));
    this.bidControl.disable({ emitEvent: false });
  }

  isOpen(race: IRace): boolean {
    return race.close >= DateTime.local();
  }
}

import { environment } from './../../../../environments/environment';
import { Component, OnInit } from '@angular/core';
import { RacesFacade } from '../../+state/races.facade';
import { Observable } from 'rxjs';
import { IRace } from '@f2020/data';
import { filter, pluck, tap, share, debounceTime } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RacesActions } from '../../+state/races.actions';

@UntilDestroy()
@Component({
  selector: 'f2020-bid',
  templateUrl: './bid.component.html',
  styleUrls: ['./bid.component.scss'],
})
export class BidComponent implements OnInit {

  fg: FormGroup;
  race$: Observable<IRace>;

  constructor(
    private facade: RacesFacade,
    private route: ActivatedRoute,
    private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.facade.dispatch(RacesActions.loadBid());
    this.fg = this.fb.group({
      qualify: [null, Validators.required],
      fastestDriver: [null, Validators.required],
      podium: [null, Validators.required],
      selectedDriver: [null],
      firstCrash: [null, Validators.required],
      polePositionTime: [null, Validators.required],
    });
    this.race$ = this.facade.selectedRace$.pipe(
      filter(race => !!race),
      tap(_ => console.log(_)),
      share()
    );
    this.facade.bid$.pipe(
      filter(bid => !bid.submitted),
      untilDestroyed(this),
    ).subscribe(bid => this.fg.patchValue(bid || {}, {emitEvent: false}));
    this.facade.bid$.pipe(
      filter(bid => bid.submitted),
      untilDestroyed(this),
    ).subscribe(() => this.fg.disable());

    this.route.params.pipe(
      pluck<Params, string>('country'),
      untilDestroyed(this),
    ).subscribe(country => this.facade.dispatch(RacesActions.selectRace({ country })));
    this.fg.valueChanges.pipe(
      debounceTime(3000),
      untilDestroyed(this),
    ).subscribe(value => this.facade.dispatch(RacesActions.updateBid({bid: value})));
  }

}

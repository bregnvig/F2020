import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { RacesActions, RacesFacade } from '@f2020/api';
import { Bid, IRace } from '@f2020/data';
import { AbstractSuperComponent } from '@f2020/shared';
import { shareLatest, truthy } from '@f2020/tools';
import { combineLatest, Observable } from 'rxjs';
import { filter, mapTo, pairwise } from 'rxjs/operators';

@Component({
  selector: 'f2020-submit-interim-result',
  templateUrl: './submit-interim-result.component.html',
  styleUrls: ['./submit-interim-result.component.scss']
})
export class SubmitInterimResultComponent extends AbstractSuperComponent implements OnInit {

  resultControl: FormControl = new FormControl();
  race$: Observable<IRace>;
  updating$: Observable<boolean>;
  loaded$: Observable<boolean>;
  private result: Partial<Bid>;

  constructor(
    private facade: RacesFacade,
    private router: Router) {
    super();
  }

  ngOnInit(): void {
    this.facade.dispatch(RacesActions.loadInterimResult());
    this.race$ = this.facade.selectedRace$.pipe(
      filter(race => !!race),
      shareLatest(),
    );
    this.updating$ = this.facade.updating$;
    this.loaded$ = combineLatest([
      this.facade.selectedRace$.pipe(truthy()),
      this.facade.interimResult$.pipe(truthy())
    ]).pipe(
      mapTo(true)
    );
    this.subscriptions.push(
      this.facade.interimResult$.pipe(
      ).subscribe(result => {
        this.result = result;
        this.resultControl.patchValue(result || {}, { emitEvent: false });
      }),
      this.updating$.pipe(
        pairwise(),
        filter(([previous, current]) => previous && current === false) ,
      ).subscribe(() => this.router.navigate(['/'])),
    );
  }

  submitResult() {
    this.facade.dispatch(RacesActions.submitInterimResult());
  }

  loadResult() {
    this.facade.dispatch(RacesActions.loadInterimResult());
  }

  resultDownloaded(): boolean {
    return !!(this.result.qualify?.length === 7
      && this.result.selectedDriver && this.result.selectedDriver.grid
      && this.result.selectedTeam && this.result.selectedTeam.qualify);
  }

}

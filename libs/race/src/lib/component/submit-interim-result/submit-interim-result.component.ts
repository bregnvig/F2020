import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RacesActions, RacesFacade } from '@f2020/api';
import { IRace, Bid } from '@f2020/data';
import { shareLatest, truthy } from '@f2020/tools';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest, Observable } from 'rxjs';
import { filter, mapTo, pairwise } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'f2020-submit-interim-result',
  templateUrl: './submit-interim-result.component.html',
  styleUrls: ['./submit-interim-result.component.scss']
})
export class SubmitInterimResultComponent implements OnInit {

  resultControl: FormControl = new FormControl();
  race$: Observable<IRace>;
  updating$: Observable<boolean>;
  loaded$: Observable<boolean>;
  private result: Partial<Bid>;

  constructor(
    private facade: RacesFacade,
    private router: Router) {
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
    this.facade.interimResult$.pipe(
      untilDestroyed(this),
    ).subscribe(result => {
      this.result = result;
      this.resultControl.patchValue(result || {}, {emitEvent: false})
    });
    this.updating$.pipe(
      pairwise(),
      filter(([previous, current]) => previous && current === false) ,
      untilDestroyed(this),
    ).subscribe(() => this.router.navigate(['/']));
  }

  submitResult() {
    this.facade.dispatch(RacesActions.submitResult());
  }

  loadResult() {
    this.facade.dispatch(RacesActions.loadInterimResult());
  }

  resultDownloaded(): boolean {
    return !!(this.result.qualify?.length === 7
      && this.result.selectedDriver && this.result.selectedDriver.grid
      && this.result.selectedTeam && this.result.selectedTeam.qualify) ;
  }

}

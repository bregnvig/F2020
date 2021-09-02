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
  selector: 'f2020-submit-result',
  templateUrl: './submit-result.component.html',
  styleUrls: ['./submit-result.component.scss']
})
export class SubmitResultComponent extends AbstractSuperComponent implements OnInit {

  resultControl: FormControl = new FormControl();
  race$: Observable<IRace>;
  updating$: Observable<boolean>;
  loaded$: Observable<boolean>;
  private result: Bid;

  constructor(
    private facade: RacesFacade,
    private router: Router) {
    super();
  }

  ngOnInit(): void {
    this.facade.dispatch(RacesActions.loadResult());
    this.race$ = this.facade.selectedRace$.pipe(
      filter(race => !!race),
      shareLatest(),
    );
    this.updating$ = this.facade.updating$;
    this.loaded$ = combineLatest([
      this.facade.selectedRace$.pipe(truthy()),
      this.facade.result$.pipe(truthy())
    ]).pipe(
      mapTo(true)
    );
    this.subscriptions.push(
      this.facade.result$.subscribe(result => {
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
    this.facade.dispatch(RacesActions.submitResult());
  }

  loadResult() {
    this.facade.dispatch(RacesActions.loadResult());
  }

  resultDownloaded(): boolean {
    return !!(this.result.qualify?.length === 7
      && this.result.fastestDriver?.length <= 2
      && this.result.podium?.length === 4
      && this.result.selectedDriver && this.result.selectedDriver.grid && this.result.selectedDriver.finish
      && this.result.polePositionTime);
  }

}

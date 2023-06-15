import { AsyncPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { RacesActions, RacesFacade } from '@f2020/api';
import { BidComponent } from '@f2020/control';
import { Bid, IRace } from '@f2020/data';
import { LoadingComponent } from '@f2020/shared';
import { shareLatest, truthy } from '@f2020/tools';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, combineLatest } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'f2020-submit-interim-result',
  templateUrl: './submit-interim-result.component.html',
  styleUrls: ['./submit-interim-result.component.scss'],
  standalone: true,
  imports: [MatToolbarModule, NgIf, BidComponent, ReactiveFormsModule, MatButtonModule, MatIconModule, NgTemplateOutlet, LoadingComponent, AsyncPipe]
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
      map(() => true)
    );
    this.facade.interimResult$.pipe(
      untilDestroyed(this),
    ).subscribe(result => {
      this.result = result;
      this.resultControl.patchValue(result || {}, { emitEvent: false });
    });
    this.updating$.pipe(
      pairwise(),
      filter(([previous, current]) => previous && current === false),
      untilDestroyed(this),
    ).subscribe(() => this.router.navigate(['/']));
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

import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RacesActions, RacesFacade, TeamService } from '@f2020/api';
import { Bid, IRace, ITeam } from '@f2020/data';

import { AsyncPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BidComponent } from '@f2020/control';
import { LoadingComponent, icon } from '@f2020/shared';
import { shareLatest, truthy } from '@f2020/tools';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, combineLatest } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'f2020-submit-result',
  templateUrl: './submit-result.component.html',
  styleUrls: ['./submit-result.component.scss'],
  standalone: true,
  imports: [MatToolbarModule, NgIf, BidComponent, ReactiveFormsModule, MatButtonModule, MatIconModule, NgTemplateOutlet, LoadingComponent, AsyncPipe, FontAwesomeModule]
})
export class SubmitResultComponent implements OnInit {

  uploadIcon = icon.farCloudArrowUp;
  refreshIcon = icon.fasRotateRight;

  resultControl = new FormControl<Bid | null>(null);
  race$: Observable<IRace>;
  updating$: Observable<boolean>;
  loaded$: Observable<boolean>;
  teams$: Observable<ITeam[]> = this.teamsService.teams$;
  private result: Bid;

  constructor(
    private facade: RacesFacade,
    private teamsService: TeamService,
    private router: Router) {
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
      map(() => true)
    );
    this.facade.result$.pipe(
      untilDestroyed(this),
    ).subscribe(result => {
      this.result = result;
      result && this.resultControl.patchValue(result, { emitEvent: false });
    });
    this.updating$.pipe(
      pairwise(),
      filter(([previous, current]) => previous && current === false),
      untilDestroyed(this),
    ).subscribe(() => this.router.navigate(['/']));
  }

  submitResult() {
    this.resultControl.valid && this.facade.dispatch(RacesActions.submitResult({ result: this.resultControl.value }));
  }

  loadResult() {
    this.facade.dispatch(RacesActions.loadResult());
  }

  resultDownloaded(): boolean {
    return !!(this.result.qualify?.length === 7
      && this.result.fastestDriver?.length === 2
      && this.result.podium?.length === 4
      && this.result.selectedDriver && this.result.selectedDriver.grid && this.result.selectedDriver.finish
      && this.result.slowestPitStop?.length === 2
      && this.result.polePositionTime);
  }

}

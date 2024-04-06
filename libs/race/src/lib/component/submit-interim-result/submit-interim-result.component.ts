import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { Component, Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { BidComponent } from '@f2020/control';
import { Bid, ITeam } from '@f2020/data';
import { icon, LoadingComponent } from '@f2020/shared';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RaceStore, TeamService } from '@f2020/api';
import { toSignal } from '@angular/core/rxjs-interop';

@UntilDestroy()
@Component({
  selector: 'f2020-submit-interim-result',
  templateUrl: './submit-interim-result.component.html',
  standalone: true,
  imports: [MatToolbarModule, BidComponent, ReactiveFormsModule, MatButtonModule, MatIconModule, NgTemplateOutlet, LoadingComponent, AsyncPipe, FontAwesomeModule],
})
export class SubmitInterimResultComponent {

  uploadIcon = icon.farCloudArrowUp;
  resultControl: FormControl = new FormControl();
  race = this.store.race;
  teams: Signal<ITeam[]>;
  updating = false;
  private result: Partial<Bid>;

  constructor(
    teamsService: TeamService,
    private store: RaceStore,
    private router: Router) {
    this.teams = toSignal(teamsService.teams$);
  }

  submitResult() {
    this.updating = true;
    this.store.submitInterimResult(this.resultControl.value).then(
      () => this.router.navigate(['/']),
      () => this.updating = false,
    );
  }
}

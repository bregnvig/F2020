import { Component, effect, inject, Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { BidComponent } from '@f2020/control';
import { ITeam } from '@f2020/data';
import { icon, LoadingComponent } from '@f2020/shared';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RaceStore, TeamService } from '@f2020/api';
import { toSignal } from '@angular/core/rxjs-interop';

@UntilDestroy()
@Component({
  selector: 'f2020-submit-interim-result',
  template: `
    <mat-toolbar color="primary">
      <span>Mellem resultat - {{ race()?.name }}</span>
    </mat-toolbar>
    <div class="max-width">
      @if (race()) {
        <f2020-bid [formControl]="resultControl" [race]="race()" [teams]="teams()" type="interim"/>
        <button mat-fab aria-label="Indsend delresultat" [disabled]="updating" (click)="submitResult()">
          <fa-icon [icon]="uploadIcon" size="lg"/>
        </button>
      }
      @if (!race() || updating) {
        <sha-loading/>
      }
    </div>
  `,
  imports: [MatToolbarModule, BidComponent, ReactiveFormsModule, MatButtonModule, MatIconModule, LoadingComponent, FaIconComponent],
})
export class SubmitInterimResultComponent {

  #store = inject(RaceStore);
  #router = inject(Router);

  uploadIcon = icon.farCloudArrowUp;
  resultControl: FormControl = new FormControl();
  race = this.#store.race;
  teams: Signal<ITeam[]>;
  updating = false;

  constructor(teamsService: TeamService) {
    this.teams = toSignal(teamsService.teams$);
    this.#store.loadInterimResult();
    effect(() => {
      const interimResult = this.#store.interimResult();
      interimResult && this.resultControl.patchValue(interimResult);
    });
  }

  submitResult() {
    this.updating = true;
    this.#store.submitInterimResult(this.resultControl.value).then(
      () => this.#router.navigate(['/']),
      () => this.updating = false,
    );
  }
}

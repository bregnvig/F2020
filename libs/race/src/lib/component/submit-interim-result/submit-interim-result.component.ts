import { ChangeDetectionStrategy, Component, effect, inject, signal, Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { BidComponent } from '@f2020/control';
import { ITeam } from '@f2020/data';
import { icon, LoadingComponent } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RaceStore, TeamService } from '@f2020/api';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'f2020-submit-interim-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar color="primary">
      <span>Mellem resultat - {{ race()?.name }}</span>
    </mat-toolbar>
    <div class="max-width">
      @if (race()) {
        <f2020-bid [formControl]="resultControl" [race]="race()" [teams]="teams()" type="interim"/>
        <button mat-fab aria-label="Indsend delresultat" [disabled]="updating()" (click)="submitResult()">
          <fa-icon [icon]="uploadIcon" size="lg"/>
        </button>
      }
      @if (!race() || updating() || loading()) {
        <sha-loading/>
      }
    </div>
  `,
  imports: [MatToolbarModule, BidComponent, ReactiveFormsModule, MatButtonModule, MatIconModule, LoadingComponent, FaIconComponent],
})
export class SubmitInterimResultComponent {

  #store = inject(RaceStore);
  #router = inject(Router);
  #snackBar = inject(MatSnackBar);

  uploadIcon = icon.farCloudArrowUp;
  resultControl: FormControl = new FormControl();
  race = this.#store.race;
  teams: Signal<ITeam[]>;
  updating = signal(false);
  loading = signal(true);

  constructor(teamsService: TeamService) {
    this.teams = toSignal(teamsService.teams$);
    this.#store.loadInterimResult();
    effect(() => {
      const interimResult = this.#store.interimResult();
      if (interimResult) {
        this.resultControl.patchValue(interimResult);
      }
      this.loading.set(false);
    });
    effect(() => {
      const error = this.#store.error();
      if (error) {
        const errorMessage = error instanceof HttpErrorResponse ? error.message : error.toString();
        this.#snackBar.open(errorMessage, undefined, { duration: 20000 });
      }
    });
  }

  submitResult() {
    this.updating.set(true);
    this.#store.submitInterimResult(this.resultControl.value).then(
      () => this.#router.navigate(['/']),
      () => this.updating.set(false),
    );
  }
}

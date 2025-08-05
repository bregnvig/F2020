import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { RaceStore, TeamService } from '@f2020/api';
import { BidComponent } from '@f2020/control';
import { Bid, IRace, ITeam } from '@f2020/data';
import { icon, LoadingComponent } from '@f2020/shared';
import { isNullish } from '@f2020/tools';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'f2020-submit-result',
  template: `
    <mat-toolbar color="primary">
      <span>Result - {{ race()?.name }}</span>
    </mat-toolbar>
    <div class="max-width">
      @if (loaded()) {
        @if (race()) {
          <f2020-bid [formControl]="resultControl" [race]="race()" [teams]="teams()" type="result"></f2020-bid>
        }
        <button mat-fab color="primary" aria-label="Indsend resultat" [disabled]="!validResult()" (click)="submitResult()">
          <fa-icon [icon]="uploadIcon" size="lg"></fa-icon>
        </button>
      }
      @if (!loaded() || !downloaded()) {
        <sha-loading/>
      }
    </div>
  `,
  imports: [MatToolbarModule, BidComponent, ReactiveFormsModule, MatButtonModule, MatIconModule, LoadingComponent, FaIconComponent],
})
export class SubmitResultComponent {

  #teamsService = inject(TeamService);
  #store = inject(RaceStore);
  #snackBar = inject(MatSnackBar);

  resultControl = new FormControl<Bid | null>(null);
  race: Signal<IRace> = this.#store.race;
  loaded: Signal<boolean> = computed(() => this.#store.loaded() && !!this.#store.result());
  teams: Signal<ITeam[]> = toSignal(this.#teamsService.teams$);
  uploadIcon = icon.farCloudArrowUp;
  validResult: Signal<boolean>;
  downloaded = signal(false);

  constructor(
    private router: Router) {
    const result = toSignal(this.resultControl.valueChanges);
    this.validResult = computed(() => !!(result()?.qualify?.length === 7
      && (result()?.fastestDriver ?? []).filter(Boolean).length === 2
      && (result()?.podium ?? []).filter(Boolean).length === 4
      && result()?.selectedDriver && result()?.selectedDriver.grid && result()?.selectedDriver.finish
      && (result()?.slowestPitStop ?? []).filter(Boolean).length === 2
      && result()?.polePositionTime),
    );
    this.#store.loadResult();
    effect(() => {
      const result = this.#store.result();
      if (result) {
        this.resultControl.patchValue(result);
        this.downloaded.set(true);

      }
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
    if (this.resultControl.valid) {
      const result = Object.fromEntries(
        Object.entries(this.resultControl.value).map(([key, value]) => [key, Array.isArray(value) ? value.filter(v => !isNullish(v)) : value]),
      ) as Bid;
      this.#store.submitResult(result).then(() => this.router.navigate(['/']));
    }
  }
}

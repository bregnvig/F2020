import { Component, computed, effect, inject, Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RaceStore, TeamService } from '@f2020/api';
import { Bid, IRace, ITeam } from '@f2020/data';

import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BidComponent } from '@f2020/control';
import { icon, LoadingComponent } from '@f2020/shared';
import { isNullish } from '@f2020/tools';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'f2020-submit-result',
  templateUrl: './submit-result.component.html',
  standalone: true,
  imports: [MatToolbarModule, BidComponent, ReactiveFormsModule, MatButtonModule, MatIconModule, NgTemplateOutlet, LoadingComponent, AsyncPipe, FontAwesomeModule],
})
export class SubmitResultComponent {

  resultControl = new FormControl<Bid | null>(null);
  race: Signal<IRace>;
  loaded: Signal<boolean>;
  teams: Signal<ITeam[]> = toSignal(this.teamsService.teams$);
  uploadIcon = icon.farCloudArrowUp;
  validResult: Signal<boolean>;
  private result: Signal<Bid>;
  private store = inject(RaceStore);

  constructor(
    private teamsService: TeamService,
    private router: Router) {
    this.loaded = computed(() => this.store.loaded() && !!this.store.result());
    this.race = this.store.race;
    this.result = this.store.result;
    const result = toSignal(this.resultControl.valueChanges);
    this.validResult = computed(() => !!(result()?.qualify?.length === 7
      && (result()?.fastestDriver ?? []).filter(Boolean).length === 2
      && (result()?.podium ?? []).filter(Boolean).length === 4
      && result()?.selectedDriver && result()?.selectedDriver.grid && result()?.selectedDriver.finish
      && (result()?.slowestPitStop ?? []).filter(Boolean).length === 2
      && result()?.polePositionTime),
    );
    this.store.loadResult();
    effect(() => this.store.result() && this.resultControl.patchValue(this.store.result()));
  }

  submitResult() {
    if (this.resultControl.valid) {
      const result = Object.fromEntries(
        Object.entries(this.resultControl.value).map(([key, value]) => [key, Array.isArray(value) ? value.filter(v => !isNullish(v)) : value]),
      ) as Bid;
      this.store.submitResult(result).then(() => this.router.navigate(['/']));
    }
  }
}

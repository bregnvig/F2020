import { Component, computed, effect, Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RaceStore, TeamService } from '@f2020/api';
import { Bid, IRace, ITeam } from '@f2020/data';

import { AsyncPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BidComponent } from '@f2020/control';
import { icon, LoadingComponent } from '@f2020/shared';
import { isNullish } from '@f2020/tools';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@UntilDestroy()
@Component({
  selector: 'f2020-submit-result',
  templateUrl: './submit-result.component.html',
  styleUrls: ['./submit-result.component.scss'],
  standalone: true,
  imports: [MatToolbarModule, NgIf, BidComponent, ReactiveFormsModule, MatButtonModule, MatIconModule, NgTemplateOutlet, LoadingComponent, AsyncPipe, FontAwesomeModule],
})
export class SubmitResultComponent {

  uploadIcon = icon.farCloudArrowUp;

  resultControl = new FormControl<Bid | null>(null);
  race: Signal<IRace>;
  updating$: Observable<boolean>;
  loaded: Signal<boolean>;
  teams: Signal<ITeam[]> = toSignal(this.teamsService.teams$);
  private result: Signal<Bid>;

  constructor(
    private store: RaceStore,
    private teamsService: TeamService,
    private router: Router) {
    this.loaded = computed(() => store.loaded() && !!store.result());
    this.race = store.race;
    this.result = store.result;
    store.loadResult();
    effect(() => store.result() && this.resultControl.patchValue(store.result(), { emitEvent: false }));
  }

  submitResult() {
    if (this.resultControl.valid) {
      const result = Object.fromEntries(
        Object.entries(this.resultControl.value).map(([key, value]) => [key, Array.isArray(value) ? value.filter(v => !isNullish(v)) : value]),
      ) as Bid;
      this.store.submitResult(result).then(() => this.router.navigate(['/']));
    }
  }

  resultDownloaded(): boolean {
    return !!(this.result()?.qualify?.length === 7
      && this.result()?.fastestDriver?.length === 2
      && this.result()?.podium?.length === 4
      && this.result()?.selectedDriver && this.result()?.selectedDriver.grid && this.result()?.selectedDriver.finish
      && this.result()?.slowestPitStop?.length === 2
      && this.result()?.polePositionTime);
  }

}

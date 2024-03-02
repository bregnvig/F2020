import { AsyncPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, Signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { BidComponent } from '@f2020/control';
import { Bid } from '@f2020/data';
import { icon, LoadingComponent } from '@f2020/shared';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RaceStore } from '@f2020/api';

@UntilDestroy()
@Component({
  selector: 'f2020-submit-interim-result',
  templateUrl: './submit-interim-result.component.html',
  standalone: true,
  imports: [MatToolbarModule, NgIf, BidComponent, ReactiveFormsModule, MatButtonModule, MatIconModule, NgTemplateOutlet, LoadingComponent, AsyncPipe, FontAwesomeModule],
})
export class SubmitInterimResultComponent {

  uploadIcon = icon.farCloudArrowUp;
  refreshIcon = icon.fasRotateRight;
  resultControl: FormControl = new FormControl();
  race = this.store.race;
  updating = false;
  loaded: Signal<boolean>;
  private result: Partial<Bid>;

  resultDownloaded = computed(() => {
    const result = this.store.interimResult();
    return !!(result?.qualify?.length === 7
      && result.selectedDriver && result.selectedDriver.grid
      && result.selectedTeam && result.selectedTeam.qualify);
  });

  constructor(
    private store: RaceStore,
    private router: Router) {
    store.loadInterimResult();
    this.loaded = computed(() => store.loaded() && !!this.store.interimResult());
    effect(() => {
      this.result = this.store.interimResult() || {};
      this.resultControl.patchValue(this.result, { emitEvent: false });

    });
  }

  submitResult() {
    this.updating = true;
    this.store.submitInterimResult(this.resultControl.value).then(
      () => this.router.navigate(['/']),
      () => this.updating = false,
    );
  }
}

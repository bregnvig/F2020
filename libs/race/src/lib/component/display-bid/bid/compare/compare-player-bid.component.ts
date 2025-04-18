import { Component, forwardRef, input } from '@angular/core';
import { AbstractControlComponent } from '../../../../../../../control/src/lib/abstract-control-component';
import { FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import { Player } from '@f2020/data';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'f2020-compare-player-bid',
  template: `
      <mat-form-field class="w-full">
        <mat-label>{{ label() }}</mat-label>
        <mat-select [formControl]="compareControl">
          @for (player of players(); track player) {
          <mat-option [value]="player.uid">
            <div class="flex gap-3">
              <img class="player-avatar rounded-full" [src]="player.photoURL" alt="{{ player.displayName }}" width="24" height="24">
              <span>{{ player.displayName }}</span>
            </div>
          </mat-option>
          }
        </mat-select>
        <mat-hint>Her kan du vælge en spiller der har afgivet bud, og sammeligne med</mat-hint>
      </mat-form-field>
  `,
  imports: [MatSelectModule, MatInputModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComparePlayerBidComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ComparePlayerBidComponent),
      multi: true,
    },
  ],
})
export class ComparePlayerBidComponent extends AbstractControlComponent<string> {
  compareControl = new FormControl<string>(null);
  players = input.required<Player[]>();
  label = input.required<string>();

  constructor() {
    super();
    this.compareControl.valueChanges.pipe(untilDestroyed(this)).subscribe(value =>
      this.propagateChange(value)
    )
  }

  writeValue(value: string): void {
    this.compareControl.setValue(value);
  }

  validate(): ValidationErrors | null {
    return this.compareControl.valid ? null : { required: true };
  }
}

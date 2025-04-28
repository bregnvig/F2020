import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import { Player } from '@f2020/data';

@Component({
  selector: 'f2020-compare-player-bid',
  template: `
      <mat-form-field class="w-full">
        <mat-label>{{ label() }}</mat-label>
        <mat-select (selectionChange)="compareWithId.emit($event.value)">
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
})
export class ComparePlayerBidComponent{
  compareWithId = output<string>()
  players = input.required<Player[]>();
  label = input.required<string>();
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Player } from '@f2020/data';

@Component({
  selector: 'f2020-compare-player-bid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <mat-form-field class="w-full">
        <mat-label>{{ label() }}</mat-label>
        <mat-select #select (selectionChange)="compareWithId.emit($event.value)">
          @if(select.value) {
           <mat-option [value]="null">
              <div class="flex gap-3">
                <img class="player-avatar rounded-full" src="assets/loading/red.svg" alt="Nulstil" width="24" height="24">
                <span>Nulstil</span>
              </div>
           </mat-option>
          }
          @for (player of players(); track player) {
            <mat-option [value]="player.uid">
              <div class="flex gap-3">
                <img class="player-avatar rounded-full" [src]="player.photoURL" [alt]="player.displayName" width="24" height="24">
                <span>{{ player.displayName }}</span>
              </div>
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
  `,
  styles: [
    `
      :host {
        mat-form-field .mat-mdc-form-field-subscript-wrapper {
          display: none;
          height: 0;
        }
      }
    `
  ],
  imports: [MatSelectModule, MatInputModule, ReactiveFormsModule],
})
export class ComparePlayerBidComponent {
  compareWithId = output<string>();
  players = input.required<Player[]>();
  label = input.required<string>();
}

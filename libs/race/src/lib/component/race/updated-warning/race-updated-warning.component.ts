import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { IRace, RaceUpdatedBy } from '@f2020/data';
import { DriverNamePipe } from '@f2020/driver';
import { DateTimePipe, icon } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'f2020-race-updated-warning',
  template: `
    <mat-card>
      <mat-card-header class="text-yellow-500">
        <fa-icon mat-card-avatar [icon]="infoIcon" size="2x"></fa-icon>
        <mat-card-title>Løbet er blevet opdateret</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @for (updatedBy of race().updatedBy; track $index) {
          <p class="flex flex-row items-center">
            <img [ngSrc]="updatedBy.player.photoURL" class="avatar" [alt]="updatedBy.player.displayName" height="40" width="40">
            <span class="ml-2 flex flex-col">
          <span>{{ messages()[$index] }}</span>
          <small class="text-slate-400">{{ updatedBy.updatedAt | dateTime: 'short' }}</small>
        </span>
          </p>
        }
      </mat-card-content>
    </mat-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, FontAwesomeModule, DateTimePipe, NgOptimizedImage],
  providers: [DriverNamePipe],
})
export class RaceUpdatedWarningComponent {

  #driverName = inject(DriverNamePipe);

  readonly infoIcon = icon.farInfo;
  readonly race = input.required<IRace>();
  readonly messages = computed(() => (this.race()?.updatedBy ?? []).map(u => [
      `${u.player.displayName} har ændret`,
      u.close ? this.getCloseChange(u) : '',
      u.close && u.selectedDriver ? ' og ' : '',
      u.selectedDriver ? this.getDriverChange(u) : '',
    ].join(' '),
  ));

  getCloseChange(u: Partial<RaceUpdatedBy>): string {
    return u.previous
      ? `lukke tidspunktet fra ${u.previous.close.toFormat('HH:mm')} til ${u.close.toFormat('HH:mm')} `
      : `lukke tidspunktet til ${u.close.toFormat('HH:mm')} `;
  }

  getDriverChange(u: Partial<RaceUpdatedBy>): string {
    return u.previous
      ? `udvalgte kører fra ${this.#driverName.transform(u.previous.selectedDriver)} til ${this.#driverName.transform(u.selectedDriver)}`
      : `udvalgte kører til ${this.#driverName.transform(u.selectedDriver)}`;
  }
}

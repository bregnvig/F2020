import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { RaceResultProvider } from '@f2020/api';
import { IDriver, IRace } from '@f2020/data';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { map } from 'rxjs/operators';
import { LiveRadioComponent } from './live-radio.component';

@Component({
  selector: 'f2020-live-radio-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <mat-card class="h-full">
      <mat-card-header>
        <mat-card-title>Holdbeskeder</mat-card-title>
        <mat-card-subtitle>
          @if (error()) {
            <fa-icon class="text-red-400 me-2" [icon]="icons.falTireFlat" />
            <span class="text-red-400">{{ error() }}</span>
          }
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <f2020-live-radio class="block mt-3" [race]="race()" [drivers]="drivers()" />
      </mat-card-content>
    </mat-card>
  `,
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, FaIconComponent, LiveRadioComponent],
})
export class LiveRadioCardComponent {
  #live = inject(RaceResultProvider);

  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();

  protected readonly icons = icon;
  protected readonly error = toSignal(this.#live.radioStatus.pipe(
    map(status => status.error?.statusText ?? status.error?.message),
  ));
}

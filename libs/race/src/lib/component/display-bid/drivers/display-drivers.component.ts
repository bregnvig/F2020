import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DriverPipe } from '@f2020/driver';
import { MatListModule } from '@angular/material/list';
import { isNullish, nullish } from '@f2020/tools';
import { DisplayPointsDiffComponent } from '../diff/display-points-diff.component';
import { DriverHeadshotComponent } from '@f2020/shared';

@Component({
  selector: 'f2020-display-drivers',
  template: `
    <mat-list>
      @for (id of driverIds(); track $index) {
        @let driver = id | driver;
        @if (driver) {
          <mat-list-item>
            <sha-driver-headshot matListItemAvatar [driver]="driver"/>
            <div class="flex w-full justify-between items-center">
              <div class="flex flex-col">
                <span>{{ driver.name }}</span>
                @if (points()) {
                  <small>{{ points()[$index] }} points</small>
                }
              </div>
              <f2020-display-points-diff [value]="points()?.[$index]" [compareWith]="comparePoints()?.[$index]" [postfix]="(compareWith()?.[$index] | driver)?.code" />
            </div>
          </mat-list-item>
        }
      }
    </mat-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, DriverHeadshotComponent, DriverPipe, DisplayPointsDiffComponent],
})
export class DisplayDriversComponent {
  readonly driverIds = input.required<string[]>();
  readonly points = input<number[] | undefined, number[] | nullish>([], {
    transform: value => value?.length && value.every(v => !isNullish(v)) ? value : undefined,
  });
  readonly compareWith = input<string[]>();
  readonly comparePoints = input<number[]>();
}

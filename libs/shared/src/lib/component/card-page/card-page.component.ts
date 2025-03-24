import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'sha-card-page',
  template: `
    <div>
      <div class="p-3 grid gap-x-4 gap-y-4 grid-cols-1 mx-auto" [ngClass]="cols()">
        <ng-content/>
      </div>
    </div>
  `,
  imports: [
    NgClass,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardPageComponent {
  cols = input<string>('max-w-3xl');
}

import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FaIconComponent, IconName, IconPrefix } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { icon } from '@f2020/shared';

@Component({
  selector: 'f2020-display-points-diff',
  template: `
    @if (value() !== undefined && postfix() && compareWith() !== undefined) {
      <small class="rounded-full py-1 px-3" [ngClass]="diff().css">
        @if (diff().icon) {
          <fa-icon class="text-sm" [icon]="diff().icon"/>
        }
        @if (compareWith() !== null) {
          {{ compareWith() }} -
        } {{ postfix() }}
      </small>
    }`,
  imports: [
    FaIconComponent,
    NgClass,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class DisplayPointsDiffComponent {
  readonly value = input.required<number | undefined>();
  readonly compareWith = input.required<number | undefined | null>();
  readonly postfix = input.required<string | undefined>();
  flipValues = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  diff = computed<{ icon: [IconPrefix, IconName] | undefined, css: string }>(() => {
    const value = this.value();
    const compareValue = this.compareWith();
    if (value < compareValue) {
      return {
        icon: this.flipValues() ? icon.fasAngleDown : icon.fasAngleUp,
        css: this.flipValues() ? 'bg-red-700' : 'bg-lime-700',
      };
    } else if (value > compareValue) {
      return {
        icon: this.flipValues() ? icon.fasAngleUp : icon.fasAngleDown,
        css: this.flipValues() ? 'bg-lime-700' : 'bg-red-700',
      };
    }
    return { icon: undefined, css: 'bg-gray-500' };
  });
}

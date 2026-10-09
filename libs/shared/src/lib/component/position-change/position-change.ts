import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { icon } from '../../font-awesome';

/**
 * Pill showing how many places was moved. Positive when moving up. Shows nothing when there is no change.
 */
@Component({
  selector: 'sha-position-change',
  template: `
    @if (change()) {
      <span class="rounded-full py-1 px-3 whitespace-nowrap" [class.bg-lime-700]="change() > 0" [class.bg-red-700]="change() < 0">
        <fa-icon class="me-1" [icon]="change() > 0 ? upIcon : downIcon" [fixedWidth]="true"/>
        {{ places() }}
      </span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FaIconComponent],
})
export class PositionChangeComponent {
  change = input.required<number>();

  protected readonly places = computed(() => Math.abs(this.change()));
  protected readonly upIcon = icon.fasAngleUp;
  protected readonly downIcon = icon.fasAngleDown;
}

import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { teamLogoUrl } from '../../formula1-media';

/**
 * The team logo in a white circle. Shows the first letter of the team name when the logo fails to load.
 */
@Component({
  selector: 'sha-team-logo',
  template: `
    @if (failed()) {
      <span class="rounded-full bg-white text-black flex items-center justify-center font-medium" [style.width.px]="size()" [style.height.px]="size()">
        {{ name().charAt(0) }}
      </span>
    } @else {
      <img class="rounded-full bg-white p-1 object-contain" [width]="size()" [height]="size()" [ngSrc]="url()" [alt]="name()" (error)="failed.set(true)">
    }
  `,
  host: {
    class: 'inline-block shrink-0',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
})
export class TeamLogoComponent {
  seasonId = input.required<string | number>();
  name = input.required<string>();
  size = input<number>(40);

  protected readonly url = computed(() => teamLogoUrl(this.seasonId(), this.name()));
  /** Reset when the logo changes */
  protected readonly failed = linkedSignal({ source: this.url, computation: () => false });
}

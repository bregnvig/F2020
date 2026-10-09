import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { SeasonStore } from '@f2020/api';
import { IDriver } from '@f2020/data';
import { driverHeadshotUrl } from '../../formula1-media';

/**
 * The headshot of the driver. Tries the photo of the season from formula1.com, then the OpenF1 headshot and last the placeholder.
 * Fills the host, so size and shape come from the host, e.g. matListItemAvatar or the avatar class.
 */
@Component({
  selector: 'sha-driver-headshot',
  template: `
    @if (src(); as src) {
      <img class="size-full rounded-[inherit] object-cover" [width]="size()" [height]="size()" [ngSrc]="src" [alt]="driver()?.name ?? ''" (error)="failed()">
    }
  `,
  host: {
    class: 'block shrink-0 overflow-hidden rounded-full',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
})
export class DriverHeadshotComponent {
  #season = inject(SeasonStore).season;

  driver = input.required<IDriver | undefined>();
  size = input<number>(40);
  placeholder = input<string>('assets/loading/yellow.svg');

  /** The images to try in order */
  #sources = computed(() => {
    const driver = this.driver();
    const seasonId = this.#season()?.id;
    return [
      driver && seasonId ? driverHeadshotUrl(seasonId, driver, this.size() * 2) : undefined,
      driver?.headshotUrl,
      this.placeholder(),
    ].filter(src => !!src);
  });
  /** Starts over when the driver changes */
  #index = linkedSignal({ source: this.#sources, computation: () => 0 });

  protected readonly src = computed(() => this.#sources()[this.#index()]);

  protected failed() {
    this.#index.update(index => Math.min(index + 1, this.#sources().length - 1));
  }
}

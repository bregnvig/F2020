import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tyre } from '@f2020/data';
import { NgOptimizedImage } from '@angular/common';

const tyreToAsset: Record<Tyre, string> = {
  FULL_WET: 'assets/loading/blue.svg',
  HARD: 'assets/loading/white.svg',
  INTERMEDIATE: 'assets/loading/green.svg',
  MEDIUM: 'assets/loading/yellow.svg',
  SOFT: 'assets/loading/red.svg',

};

@Component({
  selector: 'f2020-tyre',
  template: `<img class="inline" [ngSrc]="src()" height="24" width="24" [alt]="tyre()" />`,
  imports: [
    NgOptimizedImage,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class TyreComponent {

  tyre = input.required<Tyre>();
  src = computed(() => tyreToAsset[this.tyre()] ?? tyreToAsset['SOFT']);

}

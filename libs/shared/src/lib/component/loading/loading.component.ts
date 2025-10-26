import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

const random = (max: number): number => Math.floor(Math.random() * Math.floor(max));

const tyres: string[] = [
  'blue',
  'green',
  'red',
  'white',
  'yellow',
];

@Component({
  selector: 'sha-loading',
  template: `
    <div>
      <img width="128" height="128" [ngSrc]="tyre" alt="loading">
    </div>
  `,
  styleUrls: ['./loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgOptimizedImage,
  ],
})
export class LoadingComponent {
  readonly tyre: string;

  constructor() {
    this.tyre = `assets/loading/${tyres[random(5)]}.svg`;
  }
}

import { NgOptimizedImage } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatList, MatListItem, MatListItemAvatar, MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { LiveResultService } from '@f2020/api';
import { IDriver, IRace } from '@f2020/data';
import { shareLatest } from '@f2020/tools';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, map, take } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'f2020-live-positions',
  templateUrl: 'live-positions.component.html',
  imports: [
    MatListItem,
    MatListItemAvatar,
    NgOptimizedImage,
    MatList,
    FaIconComponent,
    MatListItemTitle,
    MatListItemLine,
  ],
  styles: `
    mat-list-item {
      transition: all 1s;
    }
  `,
})
export class LivePositionsComponent {

  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();

  initialPositions = signal<IDriver[]>([]);

  #live = inject(LiveResultService);
  latestUpdate = toSignal(this.#live.positionStatus.pipe(
    map(status => status.latestUpdate),
  ), { initialValue: null });

  #originalPosition?: Map<string, number>;
  #currentPosition?: string[];

  ngOnInit() {
    const positions$ = this.#live.getPositions(this.race(), this.drivers()).pipe(shareLatest());
    positions$.pipe(
      filter(value => value?.length > 0),
      map(positions => positions.toSorted((a, b) => a.grid - b.grid).map(p => p.driver)),
      take(1),
    ).subscribe(initial => {
      this.initialPositions.set(initial);
      this.#originalPosition = new Map(initial.map((driver, index) => [driver.driverId, index]));
      console.log('Initial positions:', [...this.#originalPosition.keys()].join(', '));
    });
    positions$.pipe(
      map(positions => positions.toSorted((a, b) => a.position - b.position)),
      map(positions => positions.map(p => p.driver.driverId)),
      untilDestroyed(this),
    ).subscribe(current => {
      console.log('Current positions:', current.join(', '));
      this.#currentPosition = current;
    });
  }

  abs(number: number) {
    return Math.abs(number);
  }

  currentChange(driverId: string) {
    const position = this.#currentPosition?.indexOf(driverId);
    return this.#originalPosition ? this.#originalPosition.get(driverId) - position : 0;
  }

  currentPosition(driverId: string) {
    const index = this.#currentPosition?.indexOf(driverId);
    return index === -1 ? '' : (this.#currentPosition?.indexOf(driverId) + 1).toString(10);
  }

  transform(uid: string) {
    const change = -this.currentChange(uid);
    return `translateY(${(change) * 100}%)`;
  }

}

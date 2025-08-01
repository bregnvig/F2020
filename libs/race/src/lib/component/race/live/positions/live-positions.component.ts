import { Component, inject, input, signal } from '@angular/core';
import { LiveResultService } from '@f2020/api';
import { IDriver, IRace } from '@f2020/data';
import { filter, first, map } from 'rxjs/operators';
import { NgOptimizedImage } from '@angular/common';
import { MatList, MatListItem, MatListItemAvatar, MatListItemTitle } from '@angular/material/list';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { shareLatest } from '@f2020/tools';
import { toSignal } from '@angular/core/rxjs-interop';

@UntilDestroy()
@Component({
  selector: 'f2020-live-postions',
  templateUrl: 'live-positions.component.html',
  imports: [
    MatListItem,
    MatListItemAvatar,
    NgOptimizedImage,
    MatList,
    FaIconComponent,
    MatListItemTitle,

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
      first(),
    ).subscribe(initial => {
      this.initialPositions.set(initial);
      this.#originalPosition = new Map(initial.map((driver, index) => [driver.driverId, index]));
    });
    positions$.pipe(
      map(positions => positions.toSorted((a, b) => a.position - b.position)),
      map(positions => positions.map(p => p.driver.driverId)),
      untilDestroyed(this),
    ).subscribe(current => this.#currentPosition = current);
  }

  abs(number: number) {
    return Math.abs(number);
  }

  currentChange(driverId: string) {
    const position = this.#currentPosition?.indexOf(driverId);
    return this.#originalPosition ? this.#originalPosition.get(driverId) - position : 0;
  }

  transform(uid: string) {
    const change = -this.currentChange(uid);
    return `translateY(${(change) * 100}%)`;
  }

}

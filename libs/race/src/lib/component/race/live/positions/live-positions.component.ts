import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatList, MatListItem, MatListItemAvatar, MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { RACE_RESULT_SERVICE } from '@f2020/api';
import { IDriver, IDriverInterval, IDriverSector, IRace, IStint } from '@f2020/data';
import { shareLatest, toMap } from '@f2020/tools';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { TyreComponent } from './tyre.component';
import { LiveSectorStatusComponent } from './live-sector-status.component';

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
    AsyncPipe,
    TyreComponent,
    LiveSectorStatusComponent,
  ],
  styles: `
    mat-list-item {
      transition: all 1s;
    }
  `,
})
export class LivePositionsComponent implements OnInit {

  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();

  initialPositions = signal<IDriver[]>([]);
  #live = inject(RACE_RESULT_SERVICE);

  latestUpdate = toSignal(this.#live.positionStatus.pipe(
    map(status => status.latestUpdate),
  ), { initialValue: null });
  stints$?: Observable<Map<string, IStint>>;
  sectors$?: Observable<Map<string, IDriverSector>>;
  currentLap$: Observable<number>;

  #originalPosition?: Map<string, number>;
  #currentPosition?: string[];
  #intervals?: Map<string, IDriverInterval>;

  ngOnInit() {
    const positions$ = this.#live.getPositions(this.race(), this.drivers()).pipe(shareLatest());
    this.currentLap$ = this.#live.currentLap;
    this.#live.getGrid(this.race(), this.drivers()).pipe(
      filter(value => value?.length > 0),
      map(gridPositions => gridPositions.map(gp => gp.driver)),
      take(1),
    ).subscribe(initial => {
      this.initialPositions.set(initial);
      this.#originalPosition = new Map(initial.map((driver, index) => [driver.driverId, index]));
    });
    positions$.pipe(
      map(positions => positions.toSorted((a, b) => a.position - b.position)),
      map(positions => positions.map(p => p.driver.driverId)),
      filter(positions => positions.length === this.initialPositions().length),
      untilDestroyed(this),
    ).subscribe(current => this.#currentPosition = current);
    this.#live.getIntervals(this.race(), this.drivers()).pipe(
      untilDestroyed(this),
    ).subscribe(intervals => this.#intervals = intervals.reduce(toMap<IDriverInterval, string>(i => i.driver.driverId), new Map<string, IDriverInterval>()));
    this.stints$ = this.#live.getStints(this.race(), this.drivers()).pipe(
      map(stints => stints.reduce(toMap(stint => stint.driver.driverId), new Map<string, IStint>)),
    );
    this.sectors$ = this.#live.getSectorStatus(this.race(), this.drivers()).pipe(
      map(sectors => sectors.reduce(toMap(stint => stint.driver.driverId), new Map<string, IDriverSector>)),
    );
  }

  abs(number: number) {
    return Math.abs(number);
  }

  currentChange(driverId: string) {
    const position = this.#currentPosition?.indexOf(driverId);
    return this.#originalPosition ? this.#originalPosition.get(driverId) - position : 0;
  }

  interval(driverId: string) {
    const interval = this.#intervals?.get(driverId)?.interval;
    return typeof interval === 'number' && interval !== 0 ? `+${interval}s` : (interval || ' ');
  }

  gapToLeader(driverId: string) {
    const interval = this.#intervals?.get(driverId)?.interval;
    const gapToLeader = this.#intervals?.get(driverId)?.gapToLeader;
    if (typeof interval === 'number' && interval === gapToLeader) return ' ';
    if (typeof interval === 'number' && !gapToLeader) return `Lapped`;

    return typeof gapToLeader === 'number' && gapToLeader !== 0 ? `(+${gapToLeader}s)` : (gapToLeader || ' ');
  }

  transform(uid: string) {
    const change = -this.currentChange(uid);
    return `translateY(${(change) * 100}%)`;
  }

}

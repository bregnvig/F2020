import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatList, MatListItem, MatListItemAvatar, MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { RaceResultProvider } from '@f2020/api';
import { IDriver, IDriverInterval, IDriverSector, IRace, IStint } from '@f2020/data';
import { shareLatest, toMap } from '@f2020/tools';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { filter, map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { TyreComponent } from './tyre.component';
import { LiveSectorStatusComponent } from './sector/live-sector-status.component';
import { AnimatedForDirective, DriverHeadshotComponent } from '@f2020/shared';

@Component({
  selector: 'f2020-live-positions',
  templateUrl: 'live-positions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatListItem,
    MatListItemAvatar,
    DriverHeadshotComponent,
    MatList,
    FaIconComponent,
    MatListItemTitle,
    MatListItemLine,
    AsyncPipe,
    TyreComponent,
    LiveSectorStatusComponent,
    AnimatedForDirective,
  ],
})
export class LivePositionsComponent implements OnInit {

  #live = inject(RaceResultProvider);
  #destroyRef = inject(DestroyRef);

  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();

  /** The drivers from first to last, the grid until the positions come */
  protected readonly order = signal<IDriver[]>([]);
  protected readonly driverKey = (driver: IDriver) => driver.driverId;
  latestUpdate = toSignal(this.#live.positionStatus.pipe(
    map(status => status.latestUpdate),
  ), { initialValue: null });
  stints$?: Observable<Map<string, IStint>>;
  sectors$?: Observable<Map<string, IDriverSector>>;
  currentLap$: Observable<number>;

  #originalPosition?: Map<string, number>;
  #intervals?: Map<string, IDriverInterval>;

  ngOnInit() {
    const positions$ = this.#live.getPositions(this.race(), this.drivers()).pipe(shareLatest());
    this.currentLap$ = this.#live.currentLap;
    this.#live.getGrid(this.race(), this.drivers()).pipe(
      filter(value => value?.length > 0),
      map(gridPositions => gridPositions.map(gp => gp.driver)),
      take(1),
    ).subscribe(initial => {
      this.#originalPosition = new Map(initial.map((driver, index) => [driver.driverId, index]));
      if (!this.order().length) this.order.set(initial);
    });
    positions$.pipe(
      map(positions => positions.toSorted((a, b) => a.position - b.position)),
      map(positions => positions.map(p => p.driver)),
      // A part of the field would move the others to the wrong places
      filter(drivers => drivers.length === this.#originalPosition?.size),
      takeUntilDestroyed(this.#destroyRef),
    ).subscribe(drivers => this.order.set(drivers));
    this.#live.getIntervals(this.race(), this.drivers()).pipe(
      takeUntilDestroyed(this.#destroyRef),
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

  /** Places moved since the start. Positive when moving up */
  protected placesMoved(driverId: string, index: number) {
    const original = this.#originalPosition?.get(driverId);
    return original === undefined ? 0 : original - index;
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

    return typeof gapToLeader === 'number' && gapToLeader !== 0 ? `(+${gapToLeader.toFixed(3)}s)` : (gapToLeader || ' ');
  }

}

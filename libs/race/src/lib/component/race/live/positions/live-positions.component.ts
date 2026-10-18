import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatList, MatListItem, MatListItemAvatar, MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { RaceResultProvider, TeamService, TrackService } from '@f2020/api';
import { IDriver, IDriverInterval, IDriverSector, IPitStop, IRace, IStint } from '@f2020/data';
import { shareLatest, toMap } from '@f2020/tools';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { interval, Observable } from 'rxjs';
import { TyreComponent } from './tyre.component';
import { LiveSectorStatusComponent } from './sector/live-sector-status.component';
import { carProgress, carsInPitLane, valueOf } from '../track/car-progress';
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
  #teams = inject(TeamService).teams$;
  #trackService = inject(TrackService);

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
  #track = rxResource({
    params: () => this.race(),
    stream: ({ params }) => this.#trackService.getTrack(params),
  });

  #playback = rxResource({
    params: () => ({ race: this.race(), drivers: this.drivers() }),
    stream: ({ params }) => this.#live.getLocationPlayback(params.race, params.drivers),
  });

  #playbackValue = valueOf(this.#playback);
  #cars = carProgress(valueOf(this.#track), this.#playbackValue);
  #second = toSignal(interval(1000));

  /**
   * The drivers in the pit lane, from how far their cars are from the track, checked every second. The cars out of the race are kept
   * for the page, so a car parked in its garage is never in the pit lane, even when the locations of a relive have a gap
   */
  protected readonly inPitLane = computed(() => {
    this.#second();
    const now = this.#playbackValue()?.now();
    if (now === undefined) return new Set<string>();
    const cars = this.#cars();
    const retired = this.#live.retiredCars;
    const frame = performance.now();
    retired.update(cars.map(({ driver, locations }) => ({ id: driver.driverId, locations })), now, frame);
    return new Set([...carsInPitLane(cars, now)].filter(driverId => retired.retiring(driverId, now, frame) === undefined));
  });

  /** The latest pit stop of each driver, by driver id */
  pitStops$?: Observable<Map<string, IPitStop>>;
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
    this.pitStops$ = this.#teams.pipe(
      switchMap(teams => this.#live.getPitStops(this.race(), this.drivers(), teams)),
      map(pitStops => pitStops
        .toSorted((a, b) => a.lap - b.lap)
        .reduce((latest, pitStop) => latest.set(pitStop.driver.driverId, pitStop), new Map<string, IPitStop>())),
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

  /**
   * The pit stop of the driver until the end of the out lap, for the time in the pit lane. The lap of a pit stop is the lap into the
   * pits, and OpenF1 has the stop from the start of the out lap, so the lap of the driver is used. The leader can be laps further on
   */
  protected latestPitStop(pitStop: IPitStop | undefined, sector: IDriverSector | undefined): IPitStop | undefined {
    return pitStop && sector && sector.lap <= pitStop.lap + 1 ? pitStop : undefined;
  }

  /** The time in the pit lane, e.g. 24,0 s */
  protected pitTime(pitStop: IPitStop): string {
    return `${(pitStop.duration / 1000).toFixed(1).replace('.', ',')} s`;
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

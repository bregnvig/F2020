import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RaceResultProvider, TeamService } from '@f2020/api';
import { combineLatest, retry, switchMap, tap } from 'rxjs';
import { Bid, buildResult, calculateResult, compareBids, IDriver, IRace } from '@f2020/data';
import { map } from 'rxjs/operators';
import { NgOptimizedImage } from '@angular/common';
import { shareLatest } from '@f2020/tools';
import { AnimatedForDirective } from '@f2020/shared';
import { MatList, MatListItem, MatListItemAvatar, MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DateTime } from 'luxon';

@Component({
  selector: 'f2020-live-race',
  templateUrl: 'live-race.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatListItem,
    MatListItemAvatar,
    NgOptimizedImage,
    MatList,
    FaIconComponent,
    MatListItemLine,
    MatListItemTitle,
    AnimatedForDirective,
  ],
})
export class LiveRaceComponent implements OnInit {

  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();
  bids = input.required<Bid[]>();
  /** The players from first to last as the race is now */
  protected readonly ranked = signal<Bid[]>([]);
  protected readonly playerKey = (bid: Bid) => bid.player.uid;

  latestUpdate = output<DateTime>();
  /** The players with their points as the race is now */
  standings = output<Bid[]>();
  #destroyRef = inject(DestroyRef);
  #live = inject(RaceResultProvider);
  #teams = inject(TeamService).teams$;

  #originalPosition?: Map<string, number>;

  ngOnInit() {

    const qualify$ = this.#live.getQualify(this.race(), this.drivers()).pipe(
      shareLatest(),
    );
    const bids$ = this.#teams.pipe(
      switchMap(teams => combineLatest([
          this.#live.getResult(this.race(), this.drivers()).pipe(
            tap(({ latestUpdate }) => this.latestUpdate.emit(latestUpdate)),
            map(({ result }) => result),
          ),
          qualify$,
          this.#live.getPitStops(this.race(), this.drivers(), teams),
        ]),
      ),
      retry({
        delay: 5000,
      }),
      map(([result, qualify, pitStops]) => buildResult(result, qualify, pitStops, this.race().selectedDriver, this.race().selectedTeam)),
      map(result => this.bids().map(bid => calculateResult(bid, result))),
      map(bids => bids.toSorted((a, b) => b.player.uid.localeCompare(a.player.uid))),
      takeUntilDestroyed(this.#destroyRef),
      shareLatest(),
    );
    bids$.pipe(
      takeUntilDestroyed(this.#destroyRef),
    ).subscribe(bids => {
      this.standings.emit(bids);
      const ranked = bids.toSorted(compareBids);
      // The places moved are from the first update of the race, so the race starts without any. The interim result is not used,
      // as the points of the race are counted from the order on the grid as soon as it starts
      this.#originalPosition ??= new Map(ranked.map((bid, index) => [bid.player.uid, index]));
      this.ranked.set(ranked);
    });
  }

  protected abs(number: number) {
    return Math.abs(number);
  }

  /** Places moved since the first update of the race. Positive when moving up */
  protected placesMoved(uid: string, index: number) {
    const original = this.#originalPosition?.get(uid);
    return original === undefined ? 0 : original - index;
  }

}

import { Component, inject, input, output, signal } from '@angular/core';
import { buildInterimResult, buildResult, RacesService, TeamService } from '@f2020/api';
import { combineLatest, firstValueFrom, retry, switchMap, tap } from 'rxjs';
import { Bid, calculateInterimResult, calculateResult, IDriver, IRace } from '@f2020/data';
import { map } from 'rxjs/operators';
import { NgOptimizedImage } from '@angular/common';
import { shareLatest } from '@f2020/tools';
import { MatList, MatListItem, MatListItemAvatar, MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DateTime } from 'luxon';

@UntilDestroy()
@Component({
  selector: 'f2020-live-race',
  templateUrl: 'live-race.component.html',
  imports: [
    MatListItem,
    MatListItemAvatar,
    NgOptimizedImage,
    MatList,
    FaIconComponent,
    MatListItemLine,
    MatListItemTitle,

  ],
  styles: `
    mat-list-item {
      transition: all 1s;
    }
  `,
})
export class LiveRaceComponent {

  race = input.required<IRace>();
  drivers = input.required<IDriver[]>();
  bids = input.required<Bid[]>();
  initialPositions = signal<Bid[]>([]);

  latestUpdate = output<DateTime>();
  #service = inject(RacesService);
  #teams = inject(TeamService).teams$;

  #originalPosition?: Map<string, number>;
  #currentPosition?: string[];

  ngOnInit() {

    const qualify$ = this.#service.getQualify(this.race(), this.drivers()).pipe(
      shareLatest(),
    );
    const bids$ = this.#teams.pipe(
      switchMap(teams => combineLatest([
          this.#service.getLiveResult(this.race(), this.drivers()).pipe(
            tap(({ latestUpdate }) => this.latestUpdate.emit(latestUpdate)),
            map(({ result }) => result),
          ),
          qualify$,
          this.#service.getLivePitStops(this.race(), this.drivers(), teams),
        ]),
      ),
      retry({
        delay: 5000,
      }),
      map(([result, qualify, pitStops]) => buildResult(result, qualify, pitStops, this.race().selectedDriver, this.race().selectedTeam)),
      map(result => this.bids().map(bid => calculateResult(bid, result))),
      map(bids => bids.toSorted((a, b) => b.player.uid.localeCompare(a.player.uid))),
      untilDestroyed(this),
      shareLatest(),
    );
    firstValueFrom(qualify$.pipe(
        map(qualify => buildInterimResult(qualify, this.race().selectedDriver, this.race().selectedTeam)),
        map(result => this.bids().map(bid => calculateInterimResult(bid, result))),
        map(bids => bids.toSorted((a, b) => b.points - a.points)),
      ),
    ).then(bids => {
      this.initialPositions.set(bids);
      this.#originalPosition = new Map(bids.map((bid, index) => [bid.player.uid, index]));
    });
    bids$.pipe(
      untilDestroyed(this),
    ).subscribe(bids => {
      this.#currentPosition = bids.toSorted((a, b) => b.points - a.points).map(bid => bid.player.uid);
      this.initialPositions.update(positions => positions.map(bid => ({
        ...bid,
        points: bids.find(b => b.player.uid === bid.player.uid)?.points ?? 0,
      } as Bid)));
    });
  }

  abs(number: number) {
    return Math.abs(number);
  }

  currentChange(uid: string) {
    const position = this.#currentPosition?.indexOf(uid);
    return this.#originalPosition ? this.#originalPosition.get(uid) - position : 0;
  }

  transform(uid: string) {
    const change = -this.currentChange(uid);
    return `translateY(${(change) * 100}%)`;
  }

}

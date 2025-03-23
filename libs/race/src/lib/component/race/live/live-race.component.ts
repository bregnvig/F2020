import { Component, inject, input } from '@angular/core';
import { buildResult, RacesService, TeamService } from '@f2020/api';
import { combineLatest, firstValueFrom, Observable, retry, switchMap, tap } from 'rxjs';
import { Bid, calculateResult, IDriver, IRace } from '@f2020/data';
import { map } from 'rxjs/operators';
import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { shareLatest } from '@f2020/tools';
import { MatList, MatListItem, MatListItemAvatar, MatListItemLine, MatListItemTitle } from '@angular/material/list';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DateTime } from 'luxon';
import { DateTimePipe } from '@f2020/shared';

@UntilDestroy()
@Component({
  selector: 'f2020-live-race',
  templateUrl: 'live-race.component.html',
  imports: [
    AsyncPipe,
    MatListItem,
    MatListItemAvatar,
    NgOptimizedImage,
    MatList,
    FaIconComponent,
    DateTimePipe,
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

  bids$?: Observable<Bid[]>;
  latestUpdate?: DateTime;
  #service = inject(RacesService);
  #teams = inject(TeamService).teams$;

  #originalPosition?: Map<string, number>;
  #currentPosition?: string[];

  ngOnInit() {

    this.bids$ = this.#teams.pipe(
      switchMap(teams => combineLatest([
          this.#service.getLiveResult(this.race(), this.drivers()).pipe(
            tap(({ latestUpdate }) => this.latestUpdate = latestUpdate),
            map(({ result }) => result),
          ),
          this.#service.getQualify(this.race(), this.drivers()),
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
    firstValueFrom(this.bids$)
      .then(bids => this.#originalPosition = new Map(bids.map((bid, index) => [bid.player.uid, index])));
    this.bids$.pipe(
      untilDestroyed(this),
    ).subscribe(bids => {
      this.#currentPosition = bids.toSorted((a, b) => b.points - a.points).map(bid => bid.player.uid);
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

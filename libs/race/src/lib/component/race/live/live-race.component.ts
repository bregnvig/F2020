import { Component, inject, input } from '@angular/core';
import { buildResult, DriversStore, RacesService, TeamService } from '@f2020/api';
import { combineLatest, firstValueFrom, Observable, switchMap, takeWhile } from 'rxjs';
import { Bid, calculateResult, IRace } from '@f2020/data';
import { map } from 'rxjs/operators';
import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { shareLatest } from '@f2020/tools';
import { MatActionList, MatListItem, MatListItemAvatar } from '@angular/material/list';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'f2020-live-race',
  templateUrl: 'live-race.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatActionList,
    MatListItem,
    MatListItemAvatar,
    NgOptimizedImage,
    MatButton,
  ],
  styles: `
    mat-list-item {
      transition: all 1s;
    }
  `,
})

export class LiveRaceComponent {

  race = input.required<IRace>();
  bids = input.required<Bid[]>();

  bids$?: Observable<Bid[]>;

  #service = inject(RacesService);
  #drivers = inject(DriversStore).drivers;
  #teams = inject(TeamService).teams$;

  #originalPosition?: Map<string, number>;
  stop = false;

  ngOnInit() {

    this.bids$ = this.#teams.pipe(
      switchMap(teams => combineLatest([
          this.#service.getLiveResult(this.race(), this.#drivers()),
          this.#service.getQualify(this.race(), this.#drivers()),
          this.#service.getLivePitStops(this.race(), this.#drivers(), teams),
        ]),
      ),
      map(([result, qualify, pitStops]) => buildResult(result, qualify, pitStops, this.race().selectedDriver, this.race().selectedTeam)),
      map(result => this.bids().map(bid => calculateResult(bid, result))),
      map(bids => bids.toSorted((a, b) => b.points - a.points)),
      takeWhile(() => !this.stop),
      shareLatest(),
    );

    firstValueFrom(this.bids$)
      .then(bids => this.#originalPosition = new Map(bids.map((bid, index) => [bid.player.uid, index])));
  }

  currentChange(uid: string, position: number) {
    return this.#originalPosition ? this.#originalPosition.get(uid) - position : 0;
  }

  transform(uid: string, index: number) {
    const change = this.currentChange(uid, index);
    return `translateY(${(change) * 100}%)`;
  }
}

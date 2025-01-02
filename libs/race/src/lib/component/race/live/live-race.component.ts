import { Component, inject, input, output } from '@angular/core';
import { buildResult, DriversStore, RacesService, TeamService } from '@f2020/api';
import { combineLatest, firstValueFrom, Observable, switchMap, takeWhile } from 'rxjs';
import { Bid, calculateResult, IRace } from '@f2020/data';
import { map } from 'rxjs/operators';
import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { shareLatest } from '@f2020/tools';
import { MatList, MatListItem, MatListItemAvatar } from '@angular/material/list';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@UntilDestroy()
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
    MatListItem,
    MatListItemAvatar,
    NgOptimizedImage,
    MatButton,
    MatList,
    FaIconComponent,
    MatCardActions,
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
  isLiveLive = input.required<boolean>();
  stopped = output<boolean>();

  bids$?: Observable<Bid[]>;

  #service = inject(RacesService);
  #drivers = inject(DriversStore).drivers;
  #teams = inject(TeamService).teams$;

  #originalPosition?: Map<string, number>;
  #currentPosition?: string[];
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
      map(bids => bids.toSorted((a, b) => b.player.uid.localeCompare(a.player.uid))),
      takeWhile(() => !this.stop),
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

  cancel() {
    this.stop = true;
    !this.isLiveLive() && this.stopped.emit(true);
  }
}

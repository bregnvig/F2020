import { Component, inject, input } from '@angular/core';
import { DriversStore, RacesService, TeamService } from '@f2020/api';
import { combineLatest, Observable, switchMap } from 'rxjs';
import { Bid, calculateResult, IRace } from '@f2020/data';
import { buildResult } from '../../../../../api/src/lib/race/service/result-builder';
import { map } from 'rxjs/operators';
import { BidsComponent } from '../bids/bids.component';
import { AsyncPipe } from '@angular/common';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';

@Component({
  selector: 'f2020-live-race',
  template: `
    @if (bids$ | async; as bids) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>Live live</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <f2020-bids [bids]="bids" [clickable]="false"/>
        </mat-card-content>
      </mat-card>
    }
  `,
  standalone: true,
  imports: [
    BidsComponent,
    AsyncPipe,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
  ],
})

export class LiveRaceComponent {

  race = input.required<IRace>();
  bids = input.required<Bid[]>();

  bids$?: Observable<Bid[]>;

  #service = inject(RacesService);
  #drivers = inject(DriversStore).drivers;
  #teams = inject(TeamService).teams$;

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
    );

  }
}

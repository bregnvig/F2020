import { DateTime } from 'luxon';
import { Component, Signal } from '@angular/core';
import { IRace } from '@f2020/data';
import { RaceStatusPipe } from './race-status.pipe';
import { FlagURLPipe, LoadingComponent } from '@f2020/shared';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { AsyncPipe, NgFor, NgIf, NgOptimizedImage } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RacesStore } from '@f2020/api';

@Component({
  selector: 'f2020-races',
  templateUrl: './races.component.html',
  styleUrls: ['./races.component.scss'],
  standalone: true,
  imports: [
    MatToolbarModule,
    NgIf,
    MatListModule,
    NgFor,
    RouterLink,
    LoadingComponent,
    AsyncPipe,
    FlagURLPipe,
    RaceStatusPipe,
    NgOptimizedImage,
  ],
})
export class RacesComponent {

  races: Signal<IRace[]>;
  now = DateTime.local();

  constructor(store: RacesStore) {
    this.races = store.races;
  }

}

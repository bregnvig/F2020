import { AsyncPipe, LowerCasePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, Signal, computed, effect } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { IDriverStanding } from '@f2020/data';
import { LoadingComponent } from '@f2020/shared';
import { StandingStore } from '../../+state/standing.store';
import { StandingListItemComponent } from './standing-list-item/standing-list-item.component';

@Component({
  selector: 'f2020-standing-list',
  templateUrl: './standing-list.component.html',
  standalone: true,
  imports: [
    MatToolbarModule,
    NgIf,
    MatListModule,
    NgFor,
    RouterLink,
    StandingListItemComponent,
    LoadingComponent,
    AsyncPipe,
    LowerCasePipe,
  ],
  providers: [
    StandingStore
  ]
})
export class StandingListComponent implements OnInit {

  standings: Signal<IDriverStanding[]>;

  constructor(private store: StandingStore, private snackBar: MatSnackBar) {
    this.store.loadStandings();
  }

  ngOnInit(): void {
    this.standings = computed(() => [...this.store.standings()].sort((a, b) => b.points - a.points || a.driver.name.localeCompare(b.driver.name)));

    effect(() => {
      if (this.store.loaded() && !this.store.standings()?.length) {
        this.snackBar.open('Der findes ingen resultater endnu', null, { duration: 3000 });
      }
    });
  }
}

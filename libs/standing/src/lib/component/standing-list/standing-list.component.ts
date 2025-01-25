import { AsyncPipe, LowerCasePipe } from '@angular/common';
import { Component, computed, effect, inject, Signal } from '@angular/core';
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
    imports: [
        MatToolbarModule,
        MatListModule,
        RouterLink,
        StandingListItemComponent,
        LoadingComponent,
        AsyncPipe,
        LowerCasePipe,
    ],
    providers: [
        StandingStore,
    ]
})
export class StandingListComponent {

  standings: Signal<IDriverStanding[]>;

  constructor(snackBar: MatSnackBar) {
    const store = inject(StandingStore);
    store.loadStandings();
    this.standings = computed(() => [...(store.standings() ?? [])].sort((a, b) => b.points - a.points || a.driver.name.localeCompare(b.driver.name)));

    effect(() => {
      if (store.loaded() && !store.standings()?.length) {
        snackBar.open('Der findes ingen resultater endnu', null, { duration: 3000 });
      }
    });
  }
}

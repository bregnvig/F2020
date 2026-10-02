import { LowerCasePipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, Signal } from '@angular/core';
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
  template: `
    <mat-toolbar color="primary">
      <span>Stilling</span>
    </mat-toolbar>
    <div class="max-w-3xl mx-auto">
      @if (standings()) {
        <mat-action-list>
          @for (standing of standings(); track standing) {
            <button mat-list-item [routerLink]="[standing.driver.driverId | lowercase]">
              <img matListItemAvatar height="40" width="40" [ngSrc]="standing.driver.headshotUrl ?? 'assets/loading/yellow.svg'" [alt]="standing.driver.name">
              <f2020-standing-list-item [standing]="standing" />
            </button>
          }
        </mat-action-list>
      } @else {
        <sha-loading />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbarModule,
    MatListModule,
    RouterLink,
    StandingListItemComponent,
    LoadingComponent,
    LowerCasePipe,
    NgOptimizedImage,
  ],
  providers: [
    StandingStore,
  ],
})
export class StandingListComponent {

  protected standings: Signal<IDriverStanding[]>;

  constructor() {
    const snackBar = inject(MatSnackBar);
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

import { LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { IDriverStanding } from '@f2020/data';
import { DriverHeadshotComponent, icon, LoadingComponent } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
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
        <div class="flex flex-row gap-4 px-4 pt-3 text-xs opacity-70">
          <span>
            <fa-icon class="mr-1" [icon]="trophyIcon" size="xs" />
            Sejr
          </span>
          <span>
            <fa-icon class="mr-1" [icon]="fastestLapIcon" size="xs" />
            Hurtigste omgang
          </span>
        </div>
        <mat-action-list>
          @for (standing of standings(); track standing) {
            <button mat-list-item [routerLink]="[standing.driver.driverId | lowercase]">
              <sha-driver-headshot matListItemAvatar [driver]="standing.driver" />
              <f2020-standing-list-item [standing]="standing" />
            </button>
          }
        </mat-action-list>
      } @else {
        <sha-loading />
      }
    </div>
    <button mat-fab aria-label="Vis kørerne som graf" routerLink="graph">
      <fa-icon [icon]="chartIcon" size="lg" />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, MatListModule, RouterLink, StandingListItemComponent, LoadingComponent, LowerCasePipe, DriverHeadshotComponent, MatButtonModule, FaIconComponent],
  providers: [StandingStore],
})
export class StandingListComponent {
  protected standings: Signal<IDriverStanding[]>;
  protected readonly chartIcon = icon.farChartLineUpDown;
  protected readonly trophyIcon = icon.farTrophy;
  protected readonly fastestLapIcon = icon.farWind;

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

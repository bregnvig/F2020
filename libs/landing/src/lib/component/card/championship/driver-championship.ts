import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { SeasonStore, StandingService } from '@f2020/api';
import { icon } from '@f2020/shared';
import { truthy } from '@f2020/tools';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { switchMap } from 'rxjs/operators';
import { ChampionshipListComponent } from './championship-list';
import { topEntries } from './championship';

@Component({
  selector: 'f2020-driver-championship',
  template: `
    <mat-card>
      <mat-card-header>
        <fa-icon mat-card-avatar [icon]="icon" size="2x"/>
        <mat-card-title>Kørermesterskabet</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <f2020-championship-list [entries]="entries()"/>
      </mat-card-content>
      <mat-card-actions>
        <a mat-button [routerLink]="['standings']">SE MERE</a>
      </mat-card-actions>
    </mat-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, FaIconComponent, MatButtonModule, RouterLink, ChampionshipListComponent],
  host: {
    '[hidden]': '!entries().length',
  },
})
export class DriverChampionshipComponent {
  #service = inject(StandingService);
  #standings = toSignal(toObservable(inject(SeasonStore).season).pipe(
    truthy(),
    switchMap(season => this.#service.getStandings(season.id)),
  ), { initialValue: [] });

  protected readonly icon = icon.fasSteeringWheel;
  protected readonly entries = computed(() => topEntries(this.#standings() ?? [], ({ driver }) => ({
    id: driver.driverId,
    name: driver.name,
    driver,
  })));
}

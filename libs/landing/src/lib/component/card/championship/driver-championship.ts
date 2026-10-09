import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ChampionshipListComponent } from './championship-list.component';
import { injectDriverStandings, topEntries } from './championship';

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
  #standings = injectDriverStandings();

  protected readonly icon = icon.fasSteeringWheel;
  protected readonly entries = computed(() => topEntries(this.#standings() ?? [], ({ driver }) => ({
    id: driver.driverId,
    name: driver.name,
    image: { url: driver.headshotUrl },
  })));
}

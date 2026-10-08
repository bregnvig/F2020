import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { SeasonStore, TeamService } from '@f2020/api';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ChampionshipListComponent } from './championship-list.component';
import { topEntries } from './championship';

@Component({
  selector: 'f2020-team-championship',
  template: `
    <mat-card>
      <mat-card-header>
        <fa-icon mat-card-avatar [icon]="icon" size="2x"/>
        <mat-card-title>Konstruktørmesterskabet</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <f2020-championship-list [entries]="entries()"/>
      </mat-card-content>
      <mat-card-actions>
        <a mat-button [routerLink]="['teams']">SE MERE</a>
      </mat-card-actions>
    </mat-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, FaIconComponent, MatButtonModule, RouterLink, ChampionshipListComponent],
  host: {
    '[hidden]': '!entries().length',
  },
})
export class TeamChampionshipComponent {
  #teams = inject(TeamService).teams;
  #season = inject(SeasonStore).season;

  protected readonly icon = icon.fasPeopleGroup;
  protected readonly entries = computed(() => topEntries(this.#teams().filter(t => t.points > 0), team => ({
    id: team.constructorId,
    name: team.name,
    logo: { seasonId: this.#season().id },
  })));
}

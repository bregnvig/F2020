import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { IDriver, ITeam } from '@f2020/data';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { icon } from '../../font-awesome';
import { DriverHeadshotComponent } from '../driver-headshot/driver-headshot';

export interface TeamDriverDialogData {
  driver: IDriver | undefined;
  team: ITeam;
  previous: boolean;
}

export type TeamDriverAction = 'remove' | 'previous';

/** What an admin can do with a driver of a team. Closes with the chosen action, or nothing when cancelled */
@Component({
  selector: 'sha-team-driver-dialog',
  template: `
    <h2 mat-dialog-title class="!flex items-center gap-3">
      <sha-driver-headshot [driver]="data.driver" />
      {{ data.driver?.name }}
    </h2>
    <mat-dialog-content>
      <mat-action-list>
        <button mat-list-item [mat-dialog-close]="'previous'">
          <fa-icon matListItemIcon [icon]="icons.falTireFlat" />
          <span matListItemTitle>{{ data.previous ? 'Kører for holdet igen' : 'Forhenværende kører' }}</span>
          <span matListItemLine>{{ data.previous ? 'Flyttes tilbage til holdets kørere' : 'Bliver på holdet, men kører ikke længere' }}</span>
        </button>
        <button mat-list-item [mat-dialog-close]="'remove'">
          <fa-icon matListItemIcon class="text-error" [icon]="icons.farTrash" />
          <span matListItemTitle>Fjern fra {{ data.team.name }}</span>
          <span matListItemLine>Fx hvis køreren blev tilføjet ved en fejl</span>
        </button>
      </mat-action-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuller</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatListModule, MatButtonModule, FaIconComponent, DriverHeadshotComponent],
})
export class TeamDriverDialog {
  protected readonly data = inject<TeamDriverDialogData>(MAT_DIALOG_DATA);
  protected readonly icons = icon;
}

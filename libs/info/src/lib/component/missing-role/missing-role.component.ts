import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardPageComponent, icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  template: `
    <mat-toolbar color="primary">
      <fa-icon class="mr-2" [icon]="icon" size="2x"></fa-icon> Halvt velkommen
    </mat-toolbar>
    <sha-card-page>
      <h2 class="mt-3">
        Du kan ikke spille før du er blevet godkendt! 😒
      </h2>
      <p>
        Jeg får automatisk at vide du har oprettet dig og skal nok godkende hvis jeg ved hvem du er 😉
      </p>
    </sha-card-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, FaIconComponent, CardPageComponent],
})
export class MissingRoleComponent {
  icon = icon.falTireFlat;
}

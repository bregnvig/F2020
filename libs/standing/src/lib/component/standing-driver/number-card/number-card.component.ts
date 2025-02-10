import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

@Component({
    selector: 'f2020-number-card',
    template: `
<mat-card class="flex-auto">
  <mat-card-header>
    <div mat-card-avatar>
      <fa-icon [icon]="icon()" [fixedWidth]="true" size="2x"></fa-icon>
    </div>
    <mat-card-title>{{title()}}</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <h1>
      {{number()}}
    </h1>
  </mat-card-content>
</mat-card>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCardModule, FontAwesomeModule]
})
export class NumberCardComponent {
  readonly title = input<string>(undefined);
  readonly icon = input<[IconPrefix, IconName]>(undefined);
  readonly number = input<string | number>(undefined);
}

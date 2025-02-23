import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { CardPageComponent, icon } from '@f2020/shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'info-rules',
  templateUrl: './rules.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, CardPageComponent, MatDividerModule, FaIconComponent],
})
export class RulesComponent {
  icon = icon.fasStar;
}

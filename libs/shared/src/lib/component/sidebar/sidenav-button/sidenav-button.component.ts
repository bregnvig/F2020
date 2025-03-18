import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'sha-sidenav-button',
  template: `
    <button mat-list-item [disabled]="disabled()">
          <span class="flex flex-row items-center">
            <fa-icon class="mr-3" [icon]="icon()" [fixedWidth]="true"/>
             <ng-content></ng-content>
          </span>
    </button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatListModule, FaIconComponent],
})
export class SidenavButtonComponent {
  readonly icon = input.required<[IconPrefix, IconName]>();
  readonly disabled = input<boolean>(false);

}

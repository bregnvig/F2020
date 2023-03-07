import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'sha-sidenav-button',
  template: `
    <button mat-list-item>
          <span class="flex flex-row items-center">
            <fa-icon class="mr-3" [icon]="icon" [fixedWidth]="true"></fa-icon>
             <ng-content></ng-content>
          </span>
    </button>`,
  styleUrls: ['./sidenav-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavButtonComponent {

  @Input() icon: [IconPrefix, IconName];
  @Input() title: string;

}

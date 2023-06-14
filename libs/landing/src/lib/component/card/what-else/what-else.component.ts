import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { icon } from '@f2020/shared';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';

const versionNo = '4';

@Component({
    selector: 'f2020-what-else',
    templateUrl: './what-else.component.html',
    styleUrls: ['./what-else.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatCardModule, FontAwesomeModule, RouterLink, MatButtonModule]
})
export class WhatElseComponent {

  @HostBinding('hidden') isHidden = localStorage.getItem('what-else') === versionNo;
  icon = icon.falRocketLaunch;
  tireFlat = icon.falTireFlat;

  dismissMessage() {
    localStorage.setItem('what-else', versionNo);
    this.isHidden = true;
  }
}

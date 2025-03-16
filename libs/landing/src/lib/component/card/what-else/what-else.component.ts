import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

const versionNo = '24';

@Component({
  selector: 'f2020-what-else',
  templateUrl: './what-else.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, FaIconComponent, MatButtonModule],
})
export class WhatElseComponent {

  @HostBinding('hidden') isHidden = localStorage.getItem('what-else') === versionNo;
  icon = icon.falRocketLaunch;
  facebook = icon.fabFacebookF;
  google = icon.fabGoogle;
  firefox = icon.fabFirefoxBrowser;

  dismissMessage() {
    localStorage.setItem('what-else', versionNo);
    this.isHidden = true;
  }
}

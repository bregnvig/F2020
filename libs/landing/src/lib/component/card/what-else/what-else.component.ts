import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { icon } from '@f2020/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

const versionNo = '12';

@Component({
  selector: 'f2020-what-else',
  templateUrl: './what-else.component.html',
  styleUrls: ['./what-else.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatCardModule, FontAwesomeModule, RouterLink, MatButtonModule],
})
export class WhatElseComponent {

  @HostBinding('hidden') isHidden = localStorage.getItem('what-else') === versionNo;
  icon = icon.falRocketLaunch;
  facebook = icon.fabFacebookF;
  google = icon.fabGoogle;

  dismissMessage() {
    localStorage.setItem('what-else', versionNo);
    this.isHidden = true;
  }
}

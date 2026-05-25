import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

const versionNo = '40';

@Component({
  selector: 'f2020-what-else',
  templateUrl: './what-else.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, FaIconComponent, MatButtonModule],
  host: {
    '[hidden]': 'isHidden()',
  },
})
export class WhatElseComponent {

  isHidden = signal(localStorage.getItem('what-else') === versionNo);
  icon = icon.falRocketLaunch;
  bug = icon.farBug;
  trophy = icon.farTrophy;

  dismissMessage() {
    localStorage.setItem('what-else', versionNo);
    this.isHidden.set(true);
  }
}

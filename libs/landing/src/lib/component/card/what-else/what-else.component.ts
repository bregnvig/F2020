import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { icon } from '@f2020/shared';

const versionNo = "3";

@Component({
  selector: 'f2020-what-else',
  templateUrl: './what-else.component.html',
  styleUrls: ['./what-else.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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

import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { icon } from '@f2020/shared';

@Component({
  selector: 'f2020-what-else',
  templateUrl: './what-else.component.html',
  styleUrls: ['./what-else.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhatElseComponent {

  @HostBinding('hidden') isHidden = localStorage.getItem('what-else') === '1';
  icon = icon.falRocketLaunch;

  dismissMessage() {
    localStorage.setItem('what-else', '1');
    this.isHidden = true;
  }
}

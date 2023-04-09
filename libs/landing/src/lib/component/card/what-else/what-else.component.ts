import { ChangeDetectionStrategy, Component } from '@angular/core';
import { icon } from '@f2020/shared';

@Component({
  selector: 'f2020-what-else',
  templateUrl: './what-else.component.html',
  styleUrls: ['./what-else.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhatElseComponent {
  icon = icon.farEgg;
  edit = icon.farInfo;
}

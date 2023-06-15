import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { CardPageComponent } from '@f2020/shared';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'info-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatToolbarModule, CardPageComponent, MatDividerModule]
})
export class RulesComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}

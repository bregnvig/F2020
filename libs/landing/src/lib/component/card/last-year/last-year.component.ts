import { ChangeDetectionStrategy, Component, HostBinding, OnInit } from '@angular/core';
import { RacesActions, RacesFacade } from '@f2020/api';
import { RoundResult } from '@f2020/data';
import { icon } from '@f2020/shared';
import { Observable, tap } from 'rxjs';
import { PolePositionTimePipe } from '@f2020/shared';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
    selector: 'f2020-last-year',
    templateUrl: './last-year.component.html',
    styleUrls: ['./last-year.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgIf, MatCardModule, FontAwesomeModule, RouterLink, MatButtonModule, AsyncPipe, PolePositionTimePipe]
})
export class LastYearComponent implements OnInit {

  @HostBinding('hidden') isHidden = true;
  lastYear$: Observable<RoundResult>;
  icon = icon.farCalendar;

  constructor(private facade: RacesFacade) { }

  ngOnInit(): void {
    this.lastYear$ = this.facade.lastYear$.pipe(
      tap(lastYear => this.isHidden = !lastYear),
    );
    this.facade.dispatch(RacesActions.loadLastYear());
  }

}

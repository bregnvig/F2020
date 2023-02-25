import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RacesActions, RacesFacade } from '@f2020/api';
import { RoundResult } from '@f2020/data';
import { icon } from '@f2020/shared';
import { Observable } from 'rxjs';

@Component({
  selector: 'f2020-last-year',
  templateUrl: './last-year.component.html',
  styleUrls: ['./last-year.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LastYearComponent implements OnInit {

  lastYear$: Observable<RoundResult>;
  icon = icon.farCalendar;

  constructor(private facade: RacesFacade) { }

  ngOnInit(): void {
    this.lastYear$ = this.facade.lastYear$;
    this.facade.dispatch(RacesActions.loadLastYear());
  }

}

import { ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RacesActions, RacesFacade } from '@f2020/api';
import { RoundResult } from '@f2020/data';
import { Observable } from 'rxjs';

@Component({
  selector: 'f2020-standing-last-year',
  templateUrl: './standing-last-year.component.html',
  styleUrls: ['./standing-last-year.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StandingLastYearComponent implements OnInit {

  round$: Observable<RoundResult>;

  constructor(private facade: RacesFacade) { }

  ngOnInit(): void {
    this.facade.dispatch(RacesActions.loadLastYear());
    this.round$ = this.facade.lastYear$;
  }
}

import { RacesFacade, RacesActions } from '@f2020/api';
import { Observable } from 'rxjs';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RoundResult } from '@f2020/data';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'f2020-last-year',
  templateUrl: './last-year.component.html',
  styleUrls: ['./last-year.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LastYearComponent implements OnInit {

  lastYear$: Observable<RoundResult>;

  constructor(private facade: RacesFacade) { }

  ngOnInit(): void {
    this.lastYear$ = this.facade.lastYear$;
    this.facade.dispatch(RacesActions.loadLastYear());
  }

}

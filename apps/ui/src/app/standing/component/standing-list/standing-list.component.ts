import { Component, OnInit } from '@angular/core';
import { StandingFacade } from '../../+state/standing.facade';
import { IDriverStanding } from '@f2020/data';
import { Observable } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'f2020-standing-list',
  templateUrl: './standing-list.component.html',
})
export class StandingListComponent implements OnInit {

  standings$: Observable<IDriverStanding[]>;

  constructor(private facade: StandingFacade) { }

  ngOnInit(): void {
    this.standings$ = this.facade.loaded$.pipe(
      filter(loaded => loaded),
      switchMap(() => this.facade.standings$),
      tap(_ => console.log('_ ', _))
    );
  }

}

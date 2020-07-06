import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IDriverStanding } from '@f2020/data';
import { Observable } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { StandingFacade } from '../../+state/standing.facade';

@Component({
  selector: 'f2020-standing-list',
  templateUrl: './standing-list.component.html',
})
export class StandingListComponent implements OnInit {

  standings$: Observable<IDriverStanding[]>;

  constructor(private facade: StandingFacade, private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.standings$ = this.facade.loaded$.pipe(
      filter(loaded => loaded),
      switchMap(() => this.facade.standings$),
      map(standings => [...standings].sort((a, b) => b.points - a.points || a.driver.name.localeCompare(b.driver.name))),
      tap(standings => {
        if (!standings.length) {
          this.snackBar.open('Der findes ingen resultater endnu', null, {duration: 3000})
        }
      })
    );
  }
}

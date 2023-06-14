import { DateTime } from 'luxon';
import { filter } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { IRace } from '@f2020/data';
import { RacesFacade } from '@f2020/api';
import { RaceStatusPipe } from './race-status.pipe';
import { FlagURLPipe } from '../../../../../shared/src/lib/pipe/flag-url.pipe';
import { LoadingComponent } from '../../../../../shared/src/lib/component/loading/loading.component';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
    selector: 'f2020-races',
    templateUrl: './races.component.html',
    styleUrls: ['./races.component.scss'],
    standalone: true,
    imports: [
        MatToolbarModule,
        NgIf,
        MatListModule,
        NgFor,
        RouterLink,
        LoadingComponent,
        AsyncPipe,
        FlagURLPipe,
        RaceStatusPipe,
    ],
})
export class RacesComponent implements OnInit {

  races$: Observable<IRace[]>;
  now = DateTime.local();

  constructor(private facade: RacesFacade) {
  }

  ngOnInit(): void {
    this.races$ = this.facade.allRaces$.pipe(
      filter(races => !!races.length)
    );
  }
}

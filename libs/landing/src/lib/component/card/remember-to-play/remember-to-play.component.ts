import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { RacesActions, RacesFacade } from '@f2020/api';
import { IRace } from '@f2020/data';
import { FlagURLPipe, RelativeToNowPipe } from '@f2020/shared';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import { debounce, debounceTime, filter, tap } from 'rxjs/operators';

@Component({
  selector: 'f2020-remember-to-play',
  templateUrl: './remember-to-play.component.html',
  styleUrls: ['./remember-to-play.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf, MatCardModule, MatButtonModule, RouterLink, AsyncPipe, RelativeToNowPipe, FlagURLPipe]
})
export class RememberToPlayComponent implements OnInit {

  @HostBinding('hidden') isHidden = true;
  race$: Observable<IRace>;

  constructor(private facade: RacesFacade) { }

  ngOnInit(): void {
    this.facade.dispatch(RacesActions.loadYourBid());
    this.race$ = this.facade.currentRace$.pipe(
      filter(race => race?.close > DateTime.local()),
      debounce(() => this.facade.yourBid$.pipe(filter(bid => bid && !bid.submitted))),
      debounceTime(0),
      tap(() => this.isHidden = false),
    );
  }

}

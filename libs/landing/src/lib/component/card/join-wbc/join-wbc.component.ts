import { Component, HostBinding, OnInit, Signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlayerStore, SeasonFacade } from '@f2020/api';
import { icon, RelativeToNowPipe } from '@f2020/shared';
import { DateTime } from 'luxon';
import { combineLatest, firstValueFrom, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'f2020-join-wbc',
  templateUrl: './join-wbc.component.html',
  standalone: true,
  imports: [
    NgIf,
    MatCardModule,
    FontAwesomeModule,
    MatButtonModule,
    RouterLink,
    AsyncPipe,
    RelativeToNowPipe,
  ],
})
export class JoinWbcComponent implements OnInit {

  @HostBinding('hidden') isHidden = true;
  latestWBCJoinDate$: Observable<DateTime>;
  canJoin$: Observable<boolean>;
  loading: Signal<boolean>;
  icon = icon.fasTrophy;

  constructor(
    private playerStore: PlayerStore,
    private seasonFacade: SeasonFacade,
    private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.loading = this.playerStore.updatingWBC;
    this.latestWBCJoinDate$ = this.seasonFacade.season$.pipe(
      map(season => season.wbc?.latestWBCJoinDate),
    );
    const uid = this.playerStore.player().uid;
    this.canJoin$ = combineLatest([
      this.latestWBCJoinDate$,
      this.seasonFacade.season$,
    ]).pipe(
      map(([lastestJoinDate, { wbc }]) => (wbc.participants || []).includes(uid) === false && lastestJoinDate > DateTime.local()),
      tap(canJoin => this.isHidden = !canJoin),
    );
  }

  joinWBC() {
    this.playerStore.joinWBC()
      .then(() => firstValueFrom(this.snackBar.open('🏆 Du deltager nu i WBC', 'FORTRYD', { duration: 5000 }).onAction()))
      .then(() => this.playerStore.undoWBC());
  }

}

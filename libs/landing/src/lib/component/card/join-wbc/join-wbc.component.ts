import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SeasonFacade } from '@f2020/api';
import { PlayerActions, PlayerFacade } from '@f2020/player';
import { truthy } from '@f2020/tools';
import { DateTime } from 'luxon';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, filter, map, pairwise, switchMap, withLatestFrom } from 'rxjs/operators';

@Component({
  selector: 'f2020-join-wbc',
  templateUrl: './join-wbc.component.html',
  styleUrls: ['./join-wbc.component.scss'],
})
export class JoinWbcComponent implements OnInit {

  latestWBCJoinDate$: Observable<DateTime>;
  canJoin$: Observable<boolean>;
  loading$: Observable<boolean>;
  
  constructor(
    private playerFacade: PlayerFacade, 
    private seasonFacade: SeasonFacade,
    private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.loading$ = this.playerFacade.updatingWBC$;
    this.latestWBCJoinDate$ = this.seasonFacade.season$.pipe(
      map(season => season.wbc?.latestWBCJoinDate)
    );
    const uid$ = this.playerFacade.player$.pipe(
      truthy(),
      map(player => player.uid)
    );
    this.canJoin$ =  combineLatest([
      this.seasonFacade.season$,
      uid$
    ]).pipe(
      map(([{wbc}, uid]) => (wbc.participants || []).includes(uid) === false)
    );
    this.loading$.pipe(
      pairwise(),
      filter(([previous, current]) => previous && !current),
      debounceTime(300),
      withLatestFrom(this.canJoin$),
      filter(([_, canJoin]) => canJoin === false),
      switchMap(() => this.snackBar.open('🏆 Du deltager nu i WBC', 'FORTRYD', {duration: 5000}).onAction())
    ).subscribe(() => this.playerFacade.dispatch(PlayerActions.undoWBC()));
  }

  joinWBC() {
    this.playerFacade.dispatch(PlayerActions.joinWBC());
  }

}

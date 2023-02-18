import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerActions, PlayerFacade, SeasonFacade } from '@f2020/api';
import { Player } from '@f2020/data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'sha-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit {

  @Output() closing = new EventEmitter<void>();
  player$: Observable<Player>;
  seasonId$: Observable<string>;

  constructor(private playerFacade: PlayerFacade, private seasonFacade: SeasonFacade, private router: Router) { }

  ngOnInit(): void {
    this.player$ = this.playerFacade.player$;
    this.seasonId$ = this.seasonFacade.season$.pipe(map(season => season.id));
  }

  signOut() {
    this.playerFacade.dispatch(PlayerActions.logoutPlayer());
  }

  signIn() {
    this.router.navigate(['login']);
  }
}

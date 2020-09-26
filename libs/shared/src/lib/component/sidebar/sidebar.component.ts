import { truthy } from '@f2020/tools';
import { map } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PlayerActions, PlayerFacade } from '@f2020/api';
import { Observable } from 'rxjs';
import { Player } from '@f2020/data';

@Component({
  selector: 'sha-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit {

  @Output() closing = new EventEmitter<void>();
  player$: Observable<Player>;

  constructor(private playerFacade: PlayerFacade) { }

  ngOnInit(): void {
    this.player$ = this.playerFacade.player$;
  }

  signOut() {
    this.playerFacade.dispatch(PlayerActions.logoutPlayer());
  }
}

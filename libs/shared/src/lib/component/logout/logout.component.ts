import { Component } from '@angular/core';
import { PlayerActions, PlayerFacade } from '@f2020/api';
import { truthy } from '@f2020/tools';
import { delay, first } from 'rxjs';

@Component({
  selector: 'sha-logout',
  template: `
  <sha-card-page>
    <sha-loading></sha-loading>
  </sha-card-page>
  `,
})
export class LogoutComponent {

  constructor(facade: PlayerFacade,) {

    facade.dispatch(PlayerActions.logoutPlayer());

    facade.unauthorized$.pipe(
      truthy(),
      delay(500),
      first(),
    ).subscribe(() => window.location.href = '/login');

  }

}
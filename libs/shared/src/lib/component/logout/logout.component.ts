import { Component } from '@angular/core';
import { PlayerActions, PlayerFacade } from '@f2020/api';
import { truthy } from '@f2020/tools';
import { delay, first } from 'rxjs';
import { LoadingComponent } from '../loading/loading.component';
import { CardPageComponent } from '../card-page/card-page.component';

@Component({
    selector: 'sha-logout',
    template: `
  <sha-card-page>
    <sha-loading></sha-loading>
  </sha-card-page>
  `,
    standalone: true,
    imports: [CardPageComponent, LoadingComponent],
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
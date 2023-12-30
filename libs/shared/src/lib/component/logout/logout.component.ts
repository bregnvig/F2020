import { Component } from '@angular/core';
import { LoadingComponent } from '../loading/loading.component';
import { CardPageComponent } from '../card-page/card-page.component';
import { PlayerStore } from '@f2020/api';

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

  constructor(store: PlayerStore) {
    store.logout().then(() => window.location.href = '/login');
  }

}

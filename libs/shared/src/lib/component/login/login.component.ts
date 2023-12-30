import { Component, computed, effect, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerApiService, PlayerStore } from '@f2020/api';
import { isNullish } from '@f2020/tools';
import { DateTime } from 'luxon';
import { icon } from '../../font-awesome';
import { LoadingComponent } from '../loading/loading.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'sha-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    MatButtonModule,
    FontAwesomeModule,
    LoadingComponent,
    AsyncPipe,
  ],
})
export class LoginComponent {

  icon = icon;

  isAuthorizationKnown: Signal<boolean>;
  isUnauthorized: Signal<boolean>;

  constructor(private service: PlayerApiService, store: PlayerStore, private router: Router) {
    effect(() => store.authorized() && this.router.navigate([DateTime.now().year]));
    this.isUnauthorized = store.unauthorized;
    this.isAuthorizationKnown = computed(() => !isNullish(store.authorized()));
  }

  loginWithGoogle() {
    this.router.navigate(['/'])
      .then(() => this.service.signInWithGoogle());
  }

  loginWithFacebook() {
    this.router.navigate(['/'])
      .then(() => this.service.signInWithFacebook());
  }

}

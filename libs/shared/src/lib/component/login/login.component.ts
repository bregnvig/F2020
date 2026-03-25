import { ChangeDetectionStrategy, Component, computed, effect, inject, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerApiService, PlayerStore } from '@f2020/api';
import { isNullish } from '@f2020/tools';
import { icon } from '../../font-awesome';
import { LoadingComponent } from '../loading/loading.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'sha-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./login.component.scss'],
  imports: [
    MatButtonModule,
    FaIconComponent,
    LoadingComponent,
  ],
})
export class LoginComponent {

  #service = inject(PlayerApiService);
  #router = inject(Router);

  icon = icon;

  isAuthorizationKnown: Signal<boolean>;
  isUnauthorized: Signal<boolean>;

  constructor() {
    const store = inject(PlayerStore);
    effect(() => store.authorized() && this.#router.navigate(['']));
    this.isUnauthorized = store.unauthorized;
    this.isAuthorizationKnown = computed(() => !isNullish(store.authorized()));
  }

  loginWithGoogle() {
    this.#router.navigate(['/'])
      .then(() => this.#service.signInWithGoogle());
  }

  loginWithFacebook() {
    this.#router.navigate(['/'])
      .then(() => this.#service.signInWithFacebook());
  }

}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerApiService, PlayerFacade } from '@f2020/api';
import { notNullish, truthy } from '@f2020/tools';
import { DateTime } from 'luxon';
import { first, map, Observable } from 'rxjs';
import { icon } from '../../font-awesome';

@Component({
  selector: 'sha-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {

  icon = icon;

  isAuthorizationKnown$: Observable<true>;
  isUnauthorized$: Observable<boolean>;

  constructor(private service: PlayerApiService, facade: PlayerFacade, private router: Router) {
    facade.authorized$.pipe(
      truthy(),
      first(),
    ).subscribe(() => this.router.navigate([DateTime.now().year]));
    this.isUnauthorized$ = facade.unauthorized$;
    this.isAuthorizationKnown$ = facade.authorized$.pipe(
      notNullish(),
      map(() => true)
    );
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

import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, Routes } from '@angular/router';
import { PlayerStore, SeasonStore } from '@f2020/api';
import { LoginComponent, LogoutComponent } from '@f2020/shared';
import { isNullish, truthy } from '@f2020/tools';
import { filter, map } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

const mustBeAuthorized = () => {
  const store = inject(PlayerStore);
  const router = inject(Router);

  return toObservable(store.unauthorized).pipe(
    filter(unauthorized => !isNullish(unauthorized)),
    map(unauthorized => unauthorized ? router.navigate(['login']).then(() => false) : true),
  );

};

const seasonLoader = (route: ActivatedRouteSnapshot) => {
  inject(SeasonStore).loadSeason(route.params['season']);
  return toObservable(inject(SeasonStore).loaded).pipe(truthy());
};


export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '2026',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'logout',
    component: LogoutComponent,
  },
  {
    path: 'players',
    canActivate: [mustBeAuthorized],
    loadChildren: () => import('@f2020/players').then(r => r.PlayersRoutes),
  },
  {
    path: 'accounts',
    canActivate: [mustBeAuthorized],
    loadChildren: () => import('@f2020/bank').then(r => r.BankRoutes),
  },
  {
    path: 'player',
    canActivate: [mustBeAuthorized],
    loadChildren: () => import('@f2020/player').then(r => r.PlayerRoutes),
  },
  {
    path: 'info',
    loadChildren: () => import('@f2020/info').then(r => r.InfoRoutes),
  },
  {
    path: ':season',
    canActivate: [mustBeAuthorized, seasonLoader],
    children: [
      {
        path: 'teams',
        canActivate: [mustBeAuthorized],
        loadChildren: () => import('@f2020/teams').then(m => m.TeamsRoutes),
      },
      {
        path: '',
        loadChildren: () => import('@f2020/landing').then(m => m.LandingRoutes),
      },
      {
        path: 'race',
        loadChildren: () => import('@f2020/race').then(m => m.RaceRouting),
      },
      {
        path: 'wbc',
        loadChildren: () => import('@f2020/wbc').then(m => m.WbcRoutes),
      },
      {
        path: 'standings',
        loadChildren: () => import('@f2020/standing').then(m => m.StandingRoutes),
      },
    ],
  },
];

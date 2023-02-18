import { inject } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';
import { PlayerFacade, SeasonLoaderService } from '@f2020/api';
import { LoginComponent } from '@f2020/shared';
import { first, map } from 'rxjs';

const mustBeAuthorized = () => {
  const facade = inject(PlayerFacade);
  const router = inject(Router);

  return facade.unauthorized$.pipe(
    first(),
    map(unauthorized => unauthorized ? router.navigate(['login']) : true)
  );

};

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '2023'
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'players',
    canActivate: [mustBeAuthorized],
    loadChildren: () => import('@f2020/players').then(m => m.PlayersModule),
  },
  {
    path: 'accounts',
    canActivate: [mustBeAuthorized],
    loadChildren: () => import('@f2020/bank').then(m => m.BankModule),
  },
  {
    path: 'player',
    canActivate: [mustBeAuthorized],
    loadChildren: () => import('@f2020/player').then(m => m.PlayerModule),
  },
  {
    path: 'teams',
    loadChildren: () => import('@f2020/teams').then(m => m.TeamsModule),
  },
  {
    path: 'info',
    loadChildren: () => import('@f2020/info').then(m => m.InfoModule),
  },
  {
    path: ':season',
    canActivate: [mustBeAuthorized, SeasonLoaderService],
    children: [
      {
        path: '',
        loadChildren: () => import('@f2020/landing').then(m => m.LandingModule),
      },
      {
        path: 'race',
        loadChildren: () => import('@f2020/race').then(m => m.RaceModule),
      },
      {
        path: 'wbc',
        loadChildren: () => import('@f2020/wbc').then(m => m.WbcModule),
      },
      {
        path: 'standings',
        loadChildren: () => import('@f2020/standing').then(m => m.StandingModule),
      }
    ]
  }
];

export const AppRoutingModule = RouterModule.forRoot(routes, {});

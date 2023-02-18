import { RouterModule, Routes } from '@angular/router';
import { SeasonLoaderService } from '@f2020/api';
import { LoginComponent } from '@f2020/shared';

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
    loadChildren: () => import('@f2020/players').then(m => m.PlayersModule),
  },
  {
    path: 'accounts',
    loadChildren: () => import('@f2020/bank').then(m => m.BankModule),
  },
  {
    path: 'player',
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
    canActivate: [SeasonLoaderService],
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

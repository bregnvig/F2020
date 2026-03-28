import { ActivatedRouteSnapshot, CanActivateFn, Routes } from '@angular/router';
import { DisplayPlayerBidComponent, DisplayResultComponent } from './component/display-bid';
import { EnterBidComponent } from './component/enter-bid/enter-bid.component';
import { RaceDriversComponent } from './component/race-drivers/race-drivers.component';
import { RaceOutletComponent } from './component/race-outlet/race-outlet.component';
import { LiveLiveComponent, RaceComponent } from './component/race';
import { RacesComponent } from './component/races/races.component';
import { SubmitInterimResultComponent } from './component/submit-interim-result/submit-interim-result.component';
import { SubmitResultComponent } from './component/submit-result/submit-result.component';
import { RaceStore } from '@f2020/api';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { truthy } from '@f2020/tools';
import { firstValueFrom } from 'rxjs';

const raceResolver = () => {
  const store = inject(RaceStore);
  return firstValueFrom(toObservable(store.race).pipe(
    truthy(),
  ));
};

const loadRace: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(RaceStore);
  store.loadRace(route.params['round']);
  return toObservable(store.loaded).pipe(truthy());
};

export const RaceRouting: Routes = [
  {
    path: '',
    component: RacesComponent,
  },
  {
    path: ':round',
    component: RaceOutletComponent,
    providers: [RaceStore],
    canActivate: [
      loadRace,
    ],
    children: [
      {
        path: '',
        component: RaceComponent,
      },
      {
        path: 'live',
        component: LiveLiveComponent,
        resolve: {
          race: raceResolver,
        },
      },
      {
        path: 'bid',
        component: EnterBidComponent,
      },
      {
        path: 'bid/:uid',
        component: DisplayPlayerBidComponent,
      },
      {
        path: 'result',
        component: DisplayResultComponent,
      },
      {
        path: 'qualify',
        component: SubmitInterimResultComponent,
        resolve: {
          race: raceResolver,
        },
      },
      {
        path: 'upload-result',
        component: SubmitResultComponent,
        resolve: {
          race: raceResolver,
        },
      },
      {
        path: 'drivers',
        component: RaceDriversComponent,
      },
    ],
  },
];

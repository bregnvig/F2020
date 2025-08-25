import { Routes } from '@angular/router';
import { DisplayPlayerBidComponent, DisplayResultComponent } from './component/display-bid';
import { EnterBidComponent } from './component/enter-bid/enter-bid.component';
import { RaceDriversComponent } from './component/race-drivers/race-drivers.component';
import { RaceOutletComponent } from './component/race-outlet/race-outlet.component';
import { LiveLiveComponent, RaceComponent } from './component/race';
import { RacesComponent } from './component/races/races.component';
import { SubmitInterimResultComponent } from './component/submit-interim-result/submit-interim-result.component';
import { SubmitResultComponent } from './component/submit-result/submit-result.component';

export const RaceRouting: Routes = [
  {
    path: '',
    component: RacesComponent,
  },
  {
    path: ':round',
    component: RaceOutletComponent,
    children: [
      {
        path: '',
        component: RaceComponent,
      },
      {
        path: 'live',
        component: LiveLiveComponent,
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
      },
      {
        path: 'upload-result',
        component: SubmitResultComponent,
      },
      {
        path: 'drivers',
        component: RaceDriversComponent,
      },
    ],
  },
];

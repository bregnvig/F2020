import { DisplayResultComponent } from './component/display-bid/display-result/display-result.component';
import { RouterModule, Routes } from '@angular/router';
import { DisplayPlayerBidComponent } from './component/display-bid/display-player-bid/display-player-bid.component';
import { EnterBidComponent } from './component/enter-bid/enter-bid.component';
import { RaceDriversComponent } from './component/race-drivers/race-drivers.component';
import { RaceOutletComponent } from './component/race-outlet/race-outlet.component';
import { RaceComponent } from './component/race/race.component';
import { RacesComponent } from './component/races/races.component';
import { SubmitInterimResultComponent } from './component/submit-interim-result/submit-interim-result.component';
import { SubmitResultComponent } from './component/submit-result/submit-result.component';

const routes: Routes = [
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
    ]
  }
];

export const RaceRoutingModule = RouterModule.forChild(routes);

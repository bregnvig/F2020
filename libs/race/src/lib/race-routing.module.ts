import { RaceDriversComponent } from './component/race-drivers/race-drivers.component';
import { RouterModule, Routes } from '@angular/router';
import { DisplayBidComponent } from './component/display-bid/display-bid.component';
import { EnterBidComponent } from './component/enter-bid/enter-bid.component';
import { RaceOutletComponent } from './component/race-outlet/race-outlet.component';
import { RaceComponent } from './component/race/race.component';
import { RacesComponent } from './component/races/races.component';
import { SubmitResultComponent } from './component/submit-result/submit-result.component';
import { SubmitInterimResultComponent } from './component/submit-interim-result/submit-interim-result.component';

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
        component: DisplayBidComponent,
      },
      {
        path: 'qualify',
        component: SubmitInterimResultComponent,
      },
      {
        path: 'result',
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

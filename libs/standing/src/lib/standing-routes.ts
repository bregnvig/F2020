import { RouterModule, Routes } from '@angular/router';
import { StandingDriverComponent } from './component/standing-driver/standing-driver.component';
import { StandingLastYearComponent } from './component/standing-last-year/standing-last-year.component';
import { StandingListComponent } from './component/standing-list/standing-list.component';

export const StandingRoutes: Routes = [
  {
    path: '',
    component: StandingListComponent,
  },
  {
    path: 'last-year',
    component: StandingLastYearComponent,
  },
  {
    path: ':driverId',
    component: StandingDriverComponent,
  },
];

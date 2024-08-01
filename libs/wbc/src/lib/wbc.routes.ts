import { Routes } from '@angular/router';
import { WbcGraphComponent } from './component/wbc-graph/wbc-graph.component';
import { WbcPlayerComponent } from './component/wbc-player/wbc-player.component';
import { WbcRaceComponent } from './component/wbc-race/wbc-race.component';
import { WbcStandingsComponent } from './component/wbc-standings/wbc-standings.component';

export const WbcRoutes: Routes = [
  {
    path: '',
    component: WbcStandingsComponent,
  },
  {
    path: 'graph',
    component: WbcGraphComponent,
  },
  {
    path: 'player/:uid',
    component: WbcPlayerComponent,
  },
  {
    path: 'race/:round',
    component: WbcRaceComponent,
  },
  /* {path: '', pathMatch: 'full', component: InsertYourComponentHere} */
];

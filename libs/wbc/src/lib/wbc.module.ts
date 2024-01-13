import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { SeasonApiModule } from '@f2020/api';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { WbcGraphComponent } from './component/wbc-graph/wbc-graph.component';
import { WbcPlayerComponent } from './component/wbc-player/wbc-player.component';
import { WbcRaceComponent } from './component/wbc-race/wbc-race.component';
import { WbcStandingsComponent } from './component/wbc-standings/wbc-standings.component';

const MaterialModulde = [
  MatListModule,
  MatButtonModule,
  MatToolbarModule,
  MatIconModule,
];

@NgModule({
  imports: [
    CommonModule,
    FontAwesomeModule,
    SeasonApiModule,
    MaterialModulde,
    NgxChartsModule,
    RouterModule.forChild([
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
    ]),
    WbcStandingsComponent,
    WbcPlayerComponent,
    WbcRaceComponent,
    WbcGraphComponent,
  ],
})
export class WbcModule {
}

import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { RouterModule } from "@angular/router";
import { SeasonApiModule } from '@f2020/api';
import { SharedModule } from '@f2020/shared';
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
    SeasonApiModule,
    MaterialModulde,
    SharedModule,
    NgxChartsModule,
    RouterModule.forChild([
      {
        path: '',
        component: WbcStandingsComponent
      },
      {
        path: 'graph',
        component: WbcGraphComponent
      },
      {
        path: 'player/:uid',
        component: WbcPlayerComponent
      },
      {
        path: 'race/:round',
        component: WbcRaceComponent
      }
      /* {path: '', pathMatch: 'full', component: InsertYourComponentHere} */
    ])
  ],
  declarations: [
    WbcStandingsComponent,
    WbcPlayerComponent,
    WbcRaceComponent,
    WbcGraphComponent,
  ]
})
export class WbcModule { }

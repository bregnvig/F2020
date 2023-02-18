import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterModule } from "@angular/router";
import { DriverModule } from "@f2020/driver";
import { SharedModule } from "@f2020/shared";
import { TeamsListComponent } from './component/teams-list/teams-list.component';

const MaterialModules = [
  MatToolbarModule,
  MatListModule,
  MatButtonModule,
  MatSnackBarModule,
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: TeamsListComponent
      }
    ]),
    MaterialModules,
    DriverModule,
    SharedModule,
  ],
  declarations: [
    TeamsListComponent
  ],
})
export class TeamsModule { }

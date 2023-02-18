import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyListModule as MatListModule } from "@angular/material/legacy-list";
import { MatLegacySnackBarModule as MatSnackBarModule } from "@angular/material/legacy-snack-bar";
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

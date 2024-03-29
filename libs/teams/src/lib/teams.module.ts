import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
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
        component: TeamsListComponent,
      },
    ]),
    MaterialModules,
    FontAwesomeModule,
    TeamsListComponent,
  ],
})
export class TeamsModule {
}

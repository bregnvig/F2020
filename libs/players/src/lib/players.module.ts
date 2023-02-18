import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { PlayersApiModule } from '@f2020/api';
import { SharedModule } from '@f2020/shared';
import { PlayersListComponent } from './component/players-list/players-list.component';
import { PlayersComponent } from './component/players/players.component';
import { EditPlayerComponent } from './edit-player/edit-player.component';

const MatModules = [
  MatListModule,
  MatCardModule,
  MatCheckboxModule,
  MatButtonModule,
  MatToolbarModule,
  MatSnackBarModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
];
@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: PlayersComponent,
        children: [
          {
            path: '',
            component: PlayersListComponent
          },
          {
            path: ':id',
            component: EditPlayerComponent
          }
        ]
      }
    ]),
    CommonModule,
    SharedModule,
    PlayersApiModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    MatModules,
  ],
  declarations: [PlayersListComponent, PlayersComponent, EditPlayerComponent]
})
export class PlayersModule {

}
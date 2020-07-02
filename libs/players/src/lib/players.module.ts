import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
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
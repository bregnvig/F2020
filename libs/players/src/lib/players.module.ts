import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PlayersListComponent } from './component/players-list/players-list.component';
import { PlayersComponent } from './component/players/players.component';
import { EditPlayerComponent } from './edit-player/edit-player.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: PlayersComponent,
        children: [
          {
            path: '',
            component: PlayersListComponent,
          },
          {
            path: ':id',
            component: EditPlayerComponent,
          },
        ],
      },
    ]),
  ],
})
export class PlayersModule {

}

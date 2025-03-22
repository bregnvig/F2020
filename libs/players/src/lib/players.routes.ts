import { Routes } from '@angular/router';
import { PlayersListComponent } from './component/players-list/players-list.component';
import { PlayersComponent } from './component/players/players.component';
import { EditPlayerComponent } from './edit-player/edit-player.component';

export const PlayersRoutes: Routes = [
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
];

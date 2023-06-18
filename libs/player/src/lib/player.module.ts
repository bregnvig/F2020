import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PlayerApiModule, PlayersApiModule } from '@f2020/api';
import { ProfileComponent } from './component/profile/profile.component';

@NgModule({
  imports: [
    CommonModule,
    PlayerApiModule,
    RouterModule.forChild([
      {
        path: '',
        component: ProfileComponent
      }
    ]),
    PlayerApiModule,
    PlayersApiModule,
  ]
})
export class PlayerModule {
}

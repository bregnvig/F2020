import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FirebaseModule } from '@f2020/firebase';
import { ProfileComponent } from './compoent/profile/profile.component';
import { PlayersApiModule, PlayerApiModule } from '@f2020/api';

const MaterialModulde = [
  MatListModule,
  MatButtonModule,
  MatToolbarModule,
  MatSlideToggleModule,
  MatIconModule,
];

@NgModule({
  imports: [
    CommonModule,
    FirebaseModule,
    MaterialModulde,
    PlayerApiModule,
    RouterModule.forChild([
      {
        path: '',
        component: ProfileComponent
      }
    ]),
    PlayerApiModule,
    PlayersApiModule,
  ],
  declarations: [
    ProfileComponent
  ]
})
export class PlayerModule {
}

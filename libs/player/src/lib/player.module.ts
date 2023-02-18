import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { PlayerApiModule, PlayersApiModule } from '@f2020/api';
import { ProfileComponent } from './compoent/profile/profile.component';

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

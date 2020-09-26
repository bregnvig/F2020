import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FirebaseModule } from '@f2020/firebase';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { PlayerActions } from './+state/player.actions';
import { PlayerEffects } from './+state/player.effects';
import { PlayerFacade } from './+state/player.facade';
import * as fromPlayer from './+state/player.reducer';

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
    StoreModule.forFeature(fromPlayer.PLAYER_FEATURE_KEY, fromPlayer.reducer),
    EffectsModule.forFeature([PlayerEffects]),
  ]
})
export class PlayerApiModule {
}

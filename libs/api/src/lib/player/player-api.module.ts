import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import * as playerEffects from './+state/player.effects';
import * as fromPlayer from './+state/player.reducer';

const MaterialModule = [
  MatListModule,
  MatButtonModule,
  MatToolbarModule,
  MatSlideToggleModule,
  MatIconModule,
];

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    StoreModule.forFeature(fromPlayer.PLAYER_FEATURE_KEY, fromPlayer.reducer),
    EffectsModule.forFeature(playerEffects),
  ]
})
export class PlayerApiModule {
}

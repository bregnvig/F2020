import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";
import * as fromPlayers from "./+state/players.reducer";
import * as playersEffects from './+state/players.effects';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(
      fromPlayers.PLAYERS_FEATURE_KEY,
      fromPlayers.reducer
    ),
    EffectsModule.forFeature(playersEffects),
  ],
  providers: []
})
export class PlayersApiModule { }

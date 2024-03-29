import { Store } from '../../store';
import { ISeason } from '@f2020/data';
import { SeasonService } from '../service/season.service';
import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

export interface SeasonState {
  season?: ISeason;
  loaded: boolean; // has the Season list been loaded
  error?: string | null; // last none error (if any)
}

@Injectable({
  providedIn: 'root',
})
export class SeasonStore extends Store<SeasonState> {

  readonly season = this.state.season;
  readonly error = this.state.error;
  readonly loaded = this.state.loaded;

  #s: Subscription;

  constructor(private service: SeasonService) {
    super({ loaded: false });
  }

  loadSeason(seasonId: string) {
    this.#s?.unsubscribe();
    this.season()?.id !== seasonId && (this.#s = this.service.loadSeason(seasonId).subscribe(season => this.setState(() => ({ season, loaded: true }))));
  }

}

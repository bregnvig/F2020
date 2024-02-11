import { AsyncPipe, NgIf, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, HostBinding, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { IRace } from '@f2020/data';
import { FlagURLPipe, RelativeToNowPipe } from '@f2020/shared';
import { DateTime } from 'luxon';
import { RacesStore } from '@f2020/api';

@Component({
  selector: 'f2020-remember-to-play',
  templateUrl: './remember-to-play.component.html',
  styleUrls: ['./remember-to-play.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf, MatCardModule, MatButtonModule, RouterLink, AsyncPipe, RelativeToNowPipe, FlagURLPipe, NgOptimizedImage],
})
export class RememberToPlayComponent {

  @HostBinding('hidden') isHidden = true;
  race: Signal<IRace | undefined>;

  constructor(private store: RacesStore) {
    this.race = computed(() => {
      if (store.currentRace()?.close > DateTime.local() && store.yourCurrentBid() && !store.yourCurrentBid().submitted) {
        return store.currentRace();
      }
    });
    effect(() => this.isHidden = !this.race());
  }

}

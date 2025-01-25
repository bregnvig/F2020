import { Component, computed, effect, HostBinding, inject, Signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlayerStore, SeasonStore } from '@f2020/api';
import { icon, RelativeToNowPipe } from '@f2020/shared';
import { DateTime } from 'luxon';
import { firstValueFrom } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'f2020-join-wbc',
  templateUrl: './join-wbc.component.html',
  imports: [
    MatCardModule,
    FontAwesomeModule,
    MatButtonModule,
    RouterLink,
    RelativeToNowPipe,
  ],
})
export class JoinWbcComponent {

  @HostBinding('hidden') isHidden = true;
  latestWBCJoinDate: Signal<DateTime>;
  canJoin: Signal<boolean>;
  loading: Signal<boolean>;
  icon = icon.fasTrophy;
  readonly playerStore = inject(PlayerStore);

  constructor(
    private snackBar: MatSnackBar) {
    this.loading = this.playerStore.updatingWBC;
    const seasonStore = inject(SeasonStore);
    this.latestWBCJoinDate = computed(() => seasonStore.season()?.wbc?.latestWBCJoinDate);

    this.canJoin = computed(() => {
      const wbc = seasonStore.season()?.wbc;
      const uid = this.playerStore.player().uid;
      return (wbc?.participants || []).includes(uid) === false && this.latestWBCJoinDate() > DateTime.local();
    });
    effect(() => this.isHidden = !this.canJoin());
  }

  joinWBC() {
    this.playerStore.joinWBC()
      .then(() => firstValueFrom(this.snackBar.open('🏆 Du deltager nu i WBC', 'FORTRYD', { duration: 5000 }).onAction()))
      .then(() => this.playerStore.undoWBC());
  }

}

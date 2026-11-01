import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { AnalyticsService, ColorSchemeService, PlayersStore, PlayerStore } from '@f2020/api';
import { ColorScheme, hiddenLandingCards, LandingCard, landingCards, Player, RaceSessionType } from '@f2020/data';
import { CardPageComponent, icon } from '@f2020/shared';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgOptimizedImage } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';

const sessionTypes: { type: RaceSessionType; label: string }[] = [
  { type: 'practice', label: 'Træning' },
  { type: 'sprint-qualifying', label: 'Sprint kvalifikation' },
  { type: 'sprint', label: 'Sprint' },
  { type: 'qualifying', label: 'Kvalifikation' },
  { type: 'race', label: 'Løb' },
];

@Component({
  selector: 'f2020-profile',
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, MatCardModule, MatListModule, MatButtonToggleModule, NgOptimizedImage, CardPageComponent, FaIconComponent],
  providers: [PlayersStore],
})
export class ProfileComponent {
  #store = inject(PlayerStore);
  #playersStore = inject(PlayersStore);
  #analytics = inject(AnalyticsService);
  #colorScheme = inject(ColorSchemeService);

  protected readonly colorSchemes: { value: ColorScheme; label: string; icon: typeof icon.farSun }[] = [
    { value: 'light', label: 'Lys', icon: icon.farSun },
    { value: 'dark', label: 'Mørk', icon: icon.farMoon },
    { value: 'system', label: 'System', icon: icon.farCircleHalfStroke },
  ];
  protected readonly colorScheme = this.#colorScheme.scheme;
  protected readonly sessionReminderOptions = computed(() => {
    const selected = this.#store.player()?.sessionReminders ?? [];
    return sessionTypes.map(option => ({ ...option, selected: selected.includes(option.type) }));
  });
  protected readonly receiveReminders = computed(() => this.#store.player()?.receiveReminders ?? true);
  protected readonly analyticsEnabled = this.#analytics.enabled;
  protected readonly analyticsGranted = computed(() => this.#analytics.consent() === 'granted');
  protected readonly players = computed<[Player, boolean][]>(() => {
    const player = this.#store.player();
    return (this.#playersStore.players() ?? []).filter(p => p.uid !== player?.uid).map(p => [p, !player?.receiveBettingStarted || player.receiveBettingStarted.includes(p.uid)]);
  });
  protected readonly landingCards = computed(() => {
    const hidden = hiddenLandingCards(this.#store.player());
    return landingCards.map(c => ({ ...c, shown: !hidden.includes(c.card) }));
  });

  constructor() {
    this.#playersStore.loadPlayers();
  }

  protected selectionChanged(change: MatSelectionListChange) {
    const receiveBettingStarted: string[] = change.source.selectedOptions.selected.map(s => s.value);
    this.#store.updatePlayer({ receiveBettingStarted });
  }

  /** Deselecting every card shows them all */
  protected landingCardsChanged(change: MatSelectionListChange) {
    if (!change.source.selectedOptions.selected.length) {
      change.source.selectAll();
    }
    const shown: LandingCard[] = change.source.selectedOptions.selected.map(s => s.value);
    this.#store.updatePlayer({ hiddenLandingCards: landingCards.map(c => c.card).filter(card => !shown.includes(card)) });
  }

  protected updateColorScheme(colorScheme: ColorScheme) {
    this.#colorScheme.set(colorScheme);
    this.#store.updatePlayer({ colorScheme });
  }

  protected sessionRemindersChanged(change: MatSelectionListChange) {
    const sessionReminders: RaceSessionType[] = change.source.selectedOptions.selected.map(s => s.value);
    this.#store.updatePlayer({ sessionReminders });
  }

  protected updateReceiveReminders(receiveReminders: boolean) {
    this.#store.updatePlayer({ receiveReminders });
  }

  protected updateAnalytics(granted: boolean) {
    this.#analytics.setConsent(granted);
  }
}

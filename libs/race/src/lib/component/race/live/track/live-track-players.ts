import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal, Signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { RaceResultProvider, TrackService } from '@f2020/api';
import { Bid, IDriver, IRace, trackProgress } from '@f2020/data';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TrackMapComponent, TrackMarker } from './track-map';

export interface LiveTrackPlayersData {
  race: IRace;
  drivers: IDriver[];
  /** The players with their points as the race is now */
  bids: Signal<Bid[]>;
}

/** A point is a tenth of a lap */
const lapPerPoint = 0.1;
/** Players with the same points are spread over half a point, the best pole position time first */
const lapForTie = 0.05;

/** How long it takes a player to move to a new place, when the points change */
const overtake = 1500;

const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;

/** How far each player is behind the leader in laps. A tenth of a lap for each point, and the best pole position time first when tied */
export const playerGaps = (bids: Bid[]): Map<string, number> => {
  const ranked = bids.toSorted((a, b) => (b.points ?? 0) - (a.points ?? 0) || (a.polePositionTimeDiff ?? Number.MAX_VALUE) - (b.polePositionTimeDiff ?? Number.MAX_VALUE));
  const leaderPoints = ranked[0]?.points ?? 0;
  return new Map(ranked.map(bid => {
    const tied = ranked.filter(other => other.points === bid.points);
    const tie = tied.length > 1 ? lapForTie * tied.indexOf(bid) / (tied.length - 1) : 0;
    return [bid.player!.uid, (leaderPoints - (bid.points ?? 0)) * lapPerPoint + tie];
  }));
};

const sameGaps = (a: Map<string, number>, b: Map<string, number>) => a.size === b.size && [...a].every(([id, gap]) => b.get(id) === gap);

@Component({
  selector: 'f2020-live-track-players',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full h-full p-4">
      <button mat-icon-button mat-dialog-close class="!absolute top-4 right-4 z-10" aria-label="Luk">
        <fa-icon [icon]="icons.farXmark" />
      </button>
      @if (track.hasValue() && markers().length) {
        <f2020-track-map class="block w-full h-full" padding="0.15" [track]="track.value()" [markers]="markers()" />
      } @else if (track.error()) {
        <p>Banen kunne ikke hentes</p>
      } @else {
        <p>Venter på bilerne...</p>
      }
    </div>
  `,
  imports: [TrackMapComponent, MatIconButton, MatDialogClose, FaIconComponent],
})
export class LiveTrackPlayersComponent {
  protected readonly icons = icon;
  #data = inject<LiveTrackPlayersData>(MAT_DIALOG_DATA);
  #live = inject(RaceResultProvider);
  #trackService = inject(TrackService);

  protected readonly track = rxResource({
    stream: () => this.#trackService.getTrack(this.#data.race),
  });

  #locations = rxResource({
    stream: () => this.#live.getLocations(this.#data.race, this.#data.drivers),
  });

  #positions = rxResource({
    stream: () => this.#live.getPositions(this.#data.race, this.#data.drivers),
  });

  /** The bids change with every update of the race, so the gaps only change when the points do */
  #gaps = computed(() => playerGaps(this.#data.bids()), { equal: sameGaps });
  /** The gaps as shown. They move to new gaps over a while, so a player is seen overtaking */
  #shownGaps = signal(new Map<string, number>());
  #fromGaps = new Map<string, number>();
  #overtakeStart = 0;
  #frame?: number;

  /**
   * The players on the track. The leader follows the car leading the race, and the others are behind by their gap.
   * A player more than a lap behind has the laps after the name
   */
  protected readonly markers = computed<TrackMarker[]>(() => {
    const track = this.track.value();
    const leader = this.#positions.value()?.find(position => position.position === 1)?.driver;
    const location = this.#locations.value()?.find(({ driver }) => driver.driverId === leader?.driverId);
    if (!track || !location) return [];
    const leaderProgress = trackProgress(track, location);
    const shown = this.#shownGaps();
    return this.#data.bids().map(({ player }) => {
      const gap = shown.get(player!.uid) ?? this.#gaps().get(player!.uid) ?? 0;
      const lapsDown = Math.floor(gap + 1e-9);
      return {
        id: player!.uid,
        progress: leaderProgress - gap,
        label: player!.displayName + (lapsDown ? ` +${lapsDown}` : ''),
        image: player!.photoURL,
      };
    });
  });

  constructor() {
    effect(() => {
      this.#gaps();
      untracked(() => this.#startOvertake());
    });
    inject(DestroyRef).onDestroy(() => this.#frame && cancelAnimationFrame(this.#frame));
  }

  #startOvertake() {
    this.#fromGaps = new Map(this.#shownGaps());
    this.#overtakeStart = performance.now();
    this.#frame ??= requestAnimationFrame(this.#step);
  }

  #step = (now: number) => {
    const share = Math.min(1, (now - this.#overtakeStart) / overtake);
    const eased = easeInOut(share);
    this.#shownGaps.set(new Map([...this.#gaps()].map(([id, to]) => {
      const from = this.#fromGaps.get(id) ?? to;
      return [id, from + (to - from) * eased];
    })));
    this.#frame = share < 1 ? requestAnimationFrame(this.#step) : undefined;
  };
}

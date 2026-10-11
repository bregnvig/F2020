import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { RaceResultProvider, TrackService } from '@f2020/api';
import { Bid, IDriver, IRace, progressAt } from '@f2020/data';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LiveRaceComponent } from '../live-race.component';
import { animationFrame } from './animation-frame';
import { carProgress } from './car-progress';
import { TrackLapComponent } from './track-lap';
import { TrackMapComponent, TrackMarker } from './track-map';

export interface LiveTrackPlayersData {
  race: IRace;
  drivers: IDriver[];
  /** The submitted bids */
  bids: Bid[];
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
    <div class="flex w-full h-full text-white" style="font-family: Roboto, sans-serif">
      <div class="relative flex-1 min-w-0 p-4">
        <f2020-track-lap class="absolute top-4 left-4 text-sm font-medium" [race]="data.race" />
        @if (track.hasValue() && markers().length) {
          <f2020-track-map class="block w-full h-full" padding="0.15" [track]="track.value()" [markers]="markers()" />
        } @else if (track.error()) {
          <p>Banen kunne ikke hentes</p>
        } @else {
          <p>Venter på bilerne...</p>
        }
      </div>
      <!-- The list gives the points of the players, so it is there on small screens as well, only hidden -->
      <f2020-live-race class="hidden md:block w-80 shrink-0 overflow-y-auto pt-14 pb-4" [race]="data.race" [bids]="data.bids"
                       [drivers]="data.drivers" (standings)="standings.set($event)" />
    </div>
    <!-- Last, so it is drawn on top of the track -->
    <button mat-icon-button mat-dialog-close class="!fixed top-2 right-2 z-10 !text-white" aria-label="Luk">
      <fa-icon [icon]="icons.farXmark" />
    </button>
  `,
  imports: [TrackMapComponent, MatIconButton, MatDialogClose, FaIconComponent, LiveRaceComponent, TrackLapComponent],
  host: { '(document:keydown.escape)': 'close()' },
})
export class LiveTrackPlayersComponent {
  protected readonly icons = icon;
  #dialogRef = inject(MatDialogRef);
  protected readonly data = inject<LiveTrackPlayersData>(MAT_DIALOG_DATA);
  #live = inject(RaceResultProvider);
  #trackService = inject(TrackService);
  #frame = animationFrame();

  /** The players with their points as the race is now */
  protected readonly standings = signal<Bid[]>([]);

  protected readonly track = rxResource({
    stream: () => this.#trackService.getTrack(this.data.race),
  });

  #playback = rxResource({
    stream: () => this.#live.getLocationPlayback(this.data.race, this.data.drivers),
  });

  #positions = rxResource({
    stream: () => this.#live.getPositions(this.data.race, this.data.drivers),
  });

  #cars = carProgress(this.track.value, this.#playback.value);

  /** The standings change with every update of the race, so the gaps only change when the points do */
  #gaps = computed(() => playerGaps(this.standings()), { equal: sameGaps });
  #fromGaps = new Map<string, number>();
  #toGaps = new Map<string, number>();
  #overtakeStart = 0;

  /**
   * The players on the track, worked out for every frame. The leader follows the car leading the race, and the others are behind
   * by their gap. A player more than a lap behind has the laps after the name
   */
  protected readonly markers = computed<TrackMarker[]>(() => {
    const frame = this.#frame();
    const now = this.#playback.value()?.now();
    const leader = this.#positions.value()?.find(position => position.position === 1)?.driver;
    const car = this.#cars().find(({ driver }) => driver.driverId === leader?.driverId);
    const leaderProgress = car && now !== undefined ? progressAt(car.samples, now) : undefined;
    if (leaderProgress === undefined) return [];
    this.#gaps();
    const gaps = this.#gapsAt(frame);
    return this.standings().map(({ player }) => {
      const gap = gaps.get(player!.uid) ?? 0;
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
    // A player is seen overtaking, as the gaps move to the new gaps over a while
    effect(() => {
      const gaps = this.#gaps();
      untracked(() => {
        const now = performance.now();
        this.#fromGaps = this.#gapsAt(now);
        this.#toGaps = gaps;
        this.#overtakeStart = now;
      });
    });
  }

  #gapsAt(time: number): Map<string, number> {
    // The time of a frame can be a little before the overtake started, and the easing is only meant for 0 to 1
    const eased = easeInOut(Math.min(1, Math.max(0, (time - this.#overtakeStart) / overtake)));
    return new Map([...this.#toGaps].map(([id, to]) => {
      const from = this.#fromGaps.get(id) ?? to;
      return [id, from + (to - from) * eased];
    }));
  }

  /** Esc closes it wherever the focus is */
  protected close() {
    this.#dialogRef.close();
  }
}

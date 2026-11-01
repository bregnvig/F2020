import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { RaceResultProvider, TrackService } from '@f2020/api';
import { Bid, compareBids, IDriver, IRace, progressAt } from '@f2020/data';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LiveRaceComponent } from '../live-race.component';
import { ReliveControlsComponent } from '../relive-controls';
import { animationFrame } from './animation-frame';
import { carProgress, valueOf } from './car-progress';
import { TrackLapComponent } from './track-lap';
import { TrackMapComponent, TrackMarker } from './track-map';

export interface LiveTrackPlayersData {
  race: IRace;
  drivers: IDriver[];
  /** The submitted bids */
  bids: Bid[];
  relive: boolean;
}

/** A point is 6% of a lap */
const lapPerPoint = 0.06;

/**
 * When the points change, the players drive to their new places instead of jumping, so a player losing points slows down and is
 * overtaken. A player gaining points drives this much faster than the leader, as a part of the leader's speed
 */
const catchUp = 0.6;
/** And a player losing points this much slower, so 0.35 drives at 65% of the leader's speed. Below 1, so no one drives backwards */
const fallBack = 0.35;
/** A player drives at the full difference in speed until this long, in milliseconds of the race, from the new place */
const settle = 6000;
/**
 * About how long a player takes to change speed, in milliseconds of the race, so a player brakes instead of stopping. At most a
 * quarter of settle, or the player drives past the new place and back
 */
const reaction = 1500;
/** Moving the relive more than this puts the players at their places at once */
const jump = 5000;
/** The leader's speed is measured over this long */
const speedPeriod = 2000;
/** The slowest the leader is taken to drive, a lap in 5 minutes, so the players still get to their places behind a safety car */
const minimumSpeed = 1 / 300_000;

/** The speed of a car in laps per millisecond of the race */
const speedAt = (samples: { time: number; progress: number }[], now: number): number => {
  const [before, after] = [progressAt(samples, now - speedPeriod), progressAt(samples, now)];
  const laps = before === undefined || after === undefined ? 0 : ((((after - before) % 1) + 1.5) % 1) - 0.5;
  return Math.max(minimumSpeed, laps / speedPeriod);
};

interface ShownGap {
  gap: number;
  /** How fast the gap grows, in laps per millisecond */
  velocity: number;
}

/** The players from first to last, the best pole position time first when tied */
const rank = (bids: Bid[]) => bids.toSorted(compareBids);

/** How far each player is behind the leader in laps, 6% of a lap for each point */
export const playerGaps = (bids: Bid[]): Map<string, number> => {
  const leaderPoints = rank(bids)[0]?.points ?? 0;
  return new Map(bids.map(bid => [bid.player!.uid, (leaderPoints - (bid.points ?? 0)) * lapPerPoint]));
};

/** How many places ahead of the players with the same points each player is, from the pole position time */
const tieSteps = (bids: Bid[]): Map<string, number> => {
  const ranked = rank(bids);
  return new Map(
    ranked.map(bid => {
      const tied = ranked.filter(other => other.points === bid.points);
      return [bid.player!.uid, tied.length - 1 - tied.indexOf(bid)];
    }),
  );
};

@Component({
  selector: 'f2020-live-track-players',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full h-full text-on-surface">
      <div class="relative flex flex-col flex-1 min-w-0 p-4">
        <f2020-track-lap class="absolute top-4 left-4 text-sm font-medium" [race]="data.race" />
        <div class="flex-1 min-h-0">
          @if (track.hasValue() && markers().length) {
            <f2020-track-map class="block w-full h-full" padding="0.15" [track]="track.value()" [markers]="markers()" />
          } @else if (track.error()) {
            <p>Banen kunne ikke hentes</p>
          } @else {
            <p>Venter på bilerne...</p>
          }
        </div>
        @if (data.relive) {
          <f2020-relive-controls class="block w-full max-w-2xl mx-auto" />
        }
      </div>
      <!-- The list gives the points of the players, so it is there on small screens as well, only hidden -->
      <f2020-live-race
        class="hidden md:block w-80 shrink-0 overflow-y-auto pt-14 pb-4"
        [race]="data.race"
        [bids]="data.bids"
        [drivers]="data.drivers"
        (standings)="standings.set($event)" />
    </div>
    <!-- Last, so it is drawn on top of the track -->
    <button mat-icon-button mat-dialog-close class="!fixed top-2 right-2 z-10 !text-on-surface" aria-label="Luk">
      <fa-icon [icon]="icons.farXmark" />
    </button>
  `,
  imports: [TrackMapComponent, MatIconButton, MatDialogClose, FaIconComponent, LiveRaceComponent, TrackLapComponent, ReliveControlsComponent],
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

  #playbackValue = valueOf(this.#playback);
  #positionsValue = valueOf(this.#positions);
  #cars = carProgress(valueOf(this.track), this.#playbackValue);

  /** The gaps the players are driving to */
  #gaps = computed(() => playerGaps(this.standings()));
  /** The gaps as they are drawn */
  #shown = new Map<string, ShownGap>();
  #shownAt?: number;

  /**
   * The players on the track, worked out for every frame. The leader follows the car leading the race, and the others are behind
   * by their gap. A player more than a lap behind has the laps after the name
   */
  protected readonly markers = computed<TrackMarker[]>(() => {
    this.#frame();
    const now = this.#playbackValue()?.now();
    const leader = this.#positionsValue()?.find(position => position.position === 1)?.driver;
    const car = this.#cars().find(({ driver }) => driver.driverId === leader?.driverId);
    const leaderProgress = car && now !== undefined ? progressAt(car.samples, now) : undefined;
    if (leaderProgress === undefined) return [];
    const gaps = this.#driveTo(this.#gaps(), now, speedAt(car!.samples, now));
    const ahead = tieSteps(this.standings());
    // The last is drawn first, so the leader is on top
    return rank(this.standings())
      .map(({ player }, index) => {
        const gap = gaps.get(player!.uid) ?? 0;
        const lapsDown = Math.floor(gap + 1e-9);
        return {
          id: player!.uid,
          progress: leaderProgress - gap,
          ahead: ahead.get(player!.uid),
          label: `${index + 1}. ${player!.displayName}` + (lapsDown ? ` +${lapsDown}` : ''),
          image: player!.photoURL,
        };
      })
      .toReversed();
  });

  /**
   * Moves the gaps drawn towards the gaps of the points, as the time of the race goes on. A player behind its place drives faster
   * than the leader, and one ahead of it slower, and changes speed gradually
   */
  #driveTo(gaps: Map<string, number>, now: number, leaderSpeed: number): Map<string, number> {
    const elapsed = this.#shownAt === undefined ? Number.MAX_VALUE : now - this.#shownAt;
    this.#shownAt = now;
    return new Map(
      [...gaps].map(([id, gap]) => {
        const shown = this.#shown.get(id);
        const next = !shown || elapsed < 0 || elapsed > jump ? { gap, velocity: 0 } : this.#drive(shown, gap, elapsed, leaderSpeed);
        this.#shown.set(id, next);
        return [id, next.gap];
      }),
    );
  }

  #drive({ gap, velocity }: ShownGap, target: number, elapsed: number, leaderSpeed: number): ShownGap {
    const clamp = (value: number) => Math.min(fallBack * leaderSpeed, Math.max(-catchUp * leaderSpeed, value));
    // Clamped again, as the leader can slow down, e.g. behind a safety car, and a player must not then drive backwards
    const next = clamp(velocity + (clamp((target - gap) / settle) - velocity) * Math.min(1, elapsed / reaction));
    return { gap: gap + next * elapsed, velocity: next };
  }

  /** Esc closes it wherever the focus is */
  protected close() {
    this.#dialogRef.close();
  }
}

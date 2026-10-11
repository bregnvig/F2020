import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, numberAttribute, signal, untracked } from '@angular/core';
import { Track, trackPosition } from '@f2020/data';

export interface TrackMarker {
  id: string;
  /** How far round the lap, from 0 at the finish line to 1 */
  progress: number;
  label: string;
  /** A picture shown away from the track, with a line to its place on the track. Without it the marker is a dot on the track */
  image?: string;
  color?: string;
}

/** A move takes as long as the time since the previous update, so the cars keep going between updates, within these limits */
const shortestMove = 100;
const longestMove = 1500;

interface Move {
  from: number;
  delta: number;
}

/**
 * The track in black with a white edge, and markers on it. The markers glide along the track to a new place,
 * so they don't cut corners when the places come seconds apart
 */
@Component({
  selector: 'f2020-track-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="block w-full h-full" [attr.viewBox]="view().box" preserveAspectRatio="xMidYMid meet">
      <defs>
        <clipPath id="track-avatar" clipPathUnits="objectBoundingBox">
          <circle cx="0.5" cy="0.5" r="0.5" />
        </clipPath>
      </defs>
      <g fill="none" stroke-linejoin="round" stroke-linecap="round">
        <path [attr.d]="view().path" stroke="#fff" [attr.stroke-width]="view().unit * 1.6" />
        <path [attr.d]="view().path" stroke="#000" [attr.stroke-width]="view().unit" />
      </g>
      <g [attr.font-size]="view().unit * 2.2" text-anchor="middle" fill="#fff" stroke="#000" paint-order="stroke"
         [attr.stroke-width]="view().unit * 0.4">
        @for (marker of placed(); track marker.id) {
          @if (marker.image) {
            <line [attr.x1]="marker.x" [attr.y1]="marker.y" [attr.x2]="marker.ax" [attr.y2]="marker.ay" stroke="#fff"
                  [attr.stroke-width]="view().unit * 0.3" />
            <circle [attr.cx]="marker.x" [attr.cy]="marker.y" [attr.r]="view().unit * 0.6" stroke="none" />
            <image [attr.href]="marker.image" [attr.x]="marker.ax - avatarRadius()" [attr.y]="marker.ay - avatarRadius()"
                   [attr.width]="avatarRadius() * 2" [attr.height]="avatarRadius() * 2" clip-path="url(#track-avatar)"
                   preserveAspectRatio="xMidYMid slice" />
            <circle [attr.cx]="marker.ax" [attr.cy]="marker.ay" [attr.r]="avatarRadius()" fill="none" stroke="#fff"
                    [attr.stroke-width]="view().unit * 0.3" />
            <text [attr.x]="marker.ax" [attr.y]="marker.ay + avatarRadius() + view().unit * 2.4">{{ marker.label }}</text>
          } @else {
            <circle [attr.cx]="marker.x" [attr.cy]="marker.y" [attr.r]="view().unit * 1.1" [attr.fill]="marker.color ?? '#fff'"
                    stroke="#fff" [attr.stroke-width]="view().unit * 0.3" />
            <text [attr.x]="marker.x" [attr.y]="marker.y - view().unit * 1.6">{{ marker.label }}</text>
          }
        }
      </g>
    </svg>
  `,
})
export class TrackMapComponent {
  track = input.required<Track>();
  markers = input<TrackMarker[]>([]);
  /** The space around the track, as a part of its size. Pictures need more room than dots */
  padding = input(0.05, { transform: numberAttribute });

  #displayed = signal(new Map<string, number>());
  #frame?: number;
  #moves = new Map<string, Move>();
  #moveStart = 0;
  #moveDuration = longestMove;

  /** The view box with the y axis flipped, as OpenF1's points up. A unit is a hundredth of the size of the track */
  protected readonly view = computed(() => {
    const { points, minX, minY, maxX, maxY } = this.track();
    const size = Math.max(maxX - minX, maxY - minY);
    const pad = size * this.padding();
    return {
      unit: size / 100,
      box: `${minX - pad} ${-maxY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`,
      path: points.map(({ x, y }, index) => `${index ? 'L' : 'M'}${x} ${-y}`).join('') + 'Z',
    };
  });

  protected readonly avatarRadius = computed(() => this.view().unit * 3.5);

  protected readonly placed = computed(() => {
    const track = this.track();
    const displayed = this.#displayed();
    const [centerX, centerY] = [(track.minX + track.maxX) / 2, (track.minY + track.maxY) / 2];
    const distance = this.view().unit * 9;
    return this.markers().map(marker => {
      const { x, y, nx, ny } = trackPosition(track, displayed.get(marker.id) ?? marker.progress);
      // The picture is put on the outside of the track
      const side = (x - centerX) * nx + (y - centerY) * ny >= 0 ? 1 : -1;
      return { ...marker, x, y: -y, ax: x + side * nx * distance, ay: -(y + side * ny * distance) };
    });
  });

  constructor() {
    effect(() => {
      const markers = this.markers();
      untracked(() => this.#move(markers));
    });
    inject(DestroyRef).onDestroy(() => this.#frame && cancelAnimationFrame(this.#frame));
  }

  /** Starts moving the markers from where they are shown to their new places */
  #move(markers: TrackMarker[]) {
    const now = performance.now();
    this.#moveDuration = Math.min(longestMove, Math.max(shortestMove, now - this.#moveStart));
    this.#moveStart = now;
    const displayed = this.#displayed();
    this.#moves = new Map(markers.map(({ id, progress }) => {
      const from = displayed.get(id) ?? progress;
      // The shortest way round, so a car crossing the finish line doesn't go back round the lap
      return [id, { from, delta: ((progress - from) % 1 + 1.5) % 1 - 0.5 }];
    }));
    this.#frame ??= requestAnimationFrame(this.#step);
  }

  #step = (now: number) => {
    const share = Math.min(1, (now - this.#moveStart) / this.#moveDuration);
    this.#displayed.set(new Map([...this.#moves].map(([id, { from, delta }]) => [id, from + delta * share])));
    this.#frame = share < 1 ? requestAnimationFrame(this.#step) : undefined;
  };
}

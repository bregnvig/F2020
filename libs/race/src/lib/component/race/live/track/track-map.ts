import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, input, numberAttribute, signal } from '@angular/core';
import { Track, trackPosition } from '@f2020/data';

export interface TrackMarker {
  id: string;
  /** How far round the lap, from 0 at the finish line to 1 */
  progress: number;
  label: string;
  /** A picture shown away from the track, with a line to its place on the track. Without it the marker is a dot on the track */
  image?: string;
  color?: string;
  /** Moves the marker ahead by this many dots and 5 pixels, so players with the same points are not on top of each other */
  ahead?: number;
  /** How far the car is in the animation of going out of the race, from 0 to 1 */
  retiring?: number;
  /** The car is in the pit lane, and is drawn faded */
  pit?: boolean;
}

/** The space between players with the same points, besides a dot */
const aheadPixels = 5;

/** The track in black with a white edge, and markers on it */
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
      <!-- The font is set, as the page's is Times New Roman and Material only sets Roboto on its own components -->
      <g [attr.font-size]="view().unit * 2" font-family="Roboto, sans-serif" font-weight="500" text-anchor="middle" fill="#fff"
         stroke="rgb(0 0 0 / 0.7)" paint-order="stroke" stroke-linejoin="round" [attr.stroke-width]="view().unit * 0.5">
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
          } @else if (marker.retiring !== undefined) {
            <!-- A red ring grows from the car, while the car fades away -->
            <g [attr.opacity]="1 - marker.retiring">
              <circle [attr.cx]="marker.x" [attr.cy]="marker.y" [attr.r]="view().unit * (1.1 + 5 * marker.retiring)" fill="none"
                      stroke="#ef4444" [attr.stroke-width]="view().unit * 0.5" />
              <circle [attr.cx]="marker.x" [attr.cy]="marker.y" [attr.r]="view().unit * 1.1 * (1 - marker.retiring)"
                      [attr.fill]="marker.color ?? '#fff'" stroke="#fff" [attr.stroke-width]="view().unit * 0.3" />
              <text [attr.x]="marker.x" [attr.y]="marker.y - view().unit * 2.2" fill="#ef4444">{{ marker.label }} DNF</text>
            </g>
          } @else {
            <g [attr.opacity]="marker.pit ? 0.5 : 1">
              <circle [attr.cx]="marker.x" [attr.cy]="marker.y" [attr.r]="view().unit * 1.1" [attr.fill]="marker.color ?? '#fff'"
                      stroke="#fff" [attr.stroke-width]="view().unit * 0.3" />
              <text [attr.x]="marker.x" [attr.y]="marker.y - view().unit * 1.6">{{ marker.label }}{{ marker.pit ? ' PIT' : '' }}</text>
            </g>
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


  /** The view box with the y axis flipped, as OpenF1's points up. A unit is a hundredth of the size of the track */
  protected readonly view = computed(() => {
    const { points, minX, minY, maxX, maxY } = this.track();
    const size = Math.max(maxX - minX, maxY - minY);
    const pad = size * this.padding();
    return {
      unit: size / 100,
      width: size + 2 * pad,
      box: `${minX - pad} ${-maxY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`,
      path: points.map(({ x, y }, index) => `${index ? 'L' : 'M'}${x} ${-y}`).join('') + 'Z',
    };
  });

  /** The size the map is shown at, to turn pixels into the units of the track */
  #size = signal({ width: 0, height: 0 });

  protected readonly avatarRadius = computed(() => this.view().unit * 3.5);

  protected readonly placed = computed(() => {
    const track = this.track();
    // A step ahead is a dot and some pixels, in the units of the track at the size the map is shown
    const { unit, width } = this.view();
    const shown = Math.max(this.#size().width, this.#size().height);
    const step = (unit * 1.2 + (shown ? aheadPixels * width / shown : 0)) / track.length;
    // The pictures are on the outside of the track, the same side all the way round, so they don't jump across it
    const distance = this.view().unit * 9 * track.outside;
    return this.markers().map(marker => {
      const { x, y, nx, ny } = trackPosition(track, marker.progress + (marker.ahead ?? 0) * step);
      return { ...marker, x, y: -y, ax: x + nx * distance, ay: -(y + ny * distance) };
    });
  });

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const observer = new ResizeObserver(([entry]) => this.#size.set({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}

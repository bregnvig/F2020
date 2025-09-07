import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ISector } from '@f2020/data';

@Component({
  selector: 'f2020-live-sector',
  template: `
    <span class="collapse bg-sky-500"></span>
    <div class="sector-container relative overflow-hidden">
      @if (sector(); as sectorData) {
        <!-- Complete Sector View -->
        @if (sectorData.status) {
          <div
            class="complete-sector transition-all duration-200 ease-in-out rounded-md"
            [class]="'bg-' + sectorData.status + '-500'"
            [style.width.px]="40"
            [style.height.px]="8">
          </div>
        } @else if (sectorData.mini && sectorData.mini.length > 0) {
          <!-- Mini Sectors View -->
          <div class="mini-sectors flex gap-0 transition-all duration-500 ease-in-out">
            @for (miniColor of sectorData.mini; track $index) {
              <div
                class="mini-sector transition-all duration-300 ease-in-out"
                [class]="'bg-' + (miniColor ?? 'sky') + '-500'"
                [class.rounded-l-md]="$first"
                [class.rounded-r-md]="$last"
                [style.width.px]="40 / sectorData.mini.length"
                [style.height.px]="8"
                [style.animation-delay.ms]="$index * 50">
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: `
    .sector-container {
      min-height: 8px;
      display: flex;
      align-items: center;
    }

    .complete-sector {
      animation: expandSector 0.5s ease-in-out;
    }

    .mini-sectors {
      animation: contractSector 0.5s ease-in-out;
    }

    .mini-sector {
      transform: scale(1);
      animation: miniSectorPulse 0.3s ease-in-out;
    }

    .mini-sector:hover {
      transform: scale(1.1);
      transition: transform 0.2s ease-in-out;
    }

    @keyframes expandSector {
      from {
        width: 8px;
        opacity: 0.7;
      }
      to {
        width: 40px;
        opacity: 1;
      }
    }

    @keyframes contractSector {
      from {
        opacity: 0.7;
        transform: translateX(16px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes miniSectorPulse {
      0% {
        opacity: 0;
        transform: scale(0.8);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.1);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Color classes - you may need to add these to your global styles */
    .bg-yellow-500 {
      background-color: #eab308;
    }

    .bg-green-500 {
      background-color: #22c55e;
    }

    .bg-purple-500 {
      background-color: #a855f7;
    }

    .bg-pitlane-500 {
      background-color: #6b7280;
    }

    .bg-unknown-500 {
      background-color: #9ca3af;
    }

    .bg-gray-300 {
      background-color: #d1d5db;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveSectorComponent {
  sector = input.required<ISector | null>();
}

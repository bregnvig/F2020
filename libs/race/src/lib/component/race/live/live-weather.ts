import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { RaceResultProvider } from '@f2020/api';
import { IRace, IWeatherReading } from '@f2020/data';
import { icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { valueOf } from './track/car-progress';

const compass = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
/** Rounded as shown, so a small drop is not shown as -0,0 */
const tenths = (value: number) => Math.round(value * 10) / 10 || 0;

/** The weather at the track now, and how the temperatures have changed since the start of the race */
@Component({
  selector: 'f2020-live-weather',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <mat-card class="h-full">
      <mat-card-header>
        <mat-card-title>Vejret</mat-card-title>
        @if (latest(); as latest) {
          <mat-card-subtitle>Målt kl. {{ latest.date.toLocal().toFormat('HH:mm') }}</mat-card-subtitle>
        }
      </mat-card-header>
      <mat-card-content class="!pt-3">
        @if (latest(); as latest) {
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <div class="text-xs opacity-70">
                <fa-icon class="me-1" [icon]="icons.farTemperatureHalf" />
                Luft
              </div>
              <div class="text-2xl tabular-nums">{{ latest.airTemperature | number: '1.1-1' }}°</div>
              @if (change(); as change) {
                <div class="text-xs opacity-70 tabular-nums">{{ change.air > 0 ? '+' : '' }}{{ change.air | number: '1.1-1' }}° siden start</div>
              }
            </div>
            <div>
              <div class="text-xs opacity-70">
                <fa-icon class="me-1" [icon]="icons.farRoad" />
                Banen
              </div>
              <div class="text-2xl tabular-nums">{{ latest.trackTemperature | number: '1.1-1' }}°</div>
              @if (change(); as change) {
                <div class="text-xs opacity-70 tabular-nums">{{ change.track > 0 ? '+' : '' }}{{ change.track | number: '1.1-1' }}° siden start</div>
              }
            </div>
            <div>
              <div class="text-xs opacity-70">
                <fa-icon class="me-1" [icon]="latest.rainfall ? icons.farCloudRain : icons.farSun" />
                Nedbør
              </div>
              <div class="text-2xl" [class.text-blue-400]="latest.rainfall">{{ latest.rainfall ? 'Regn' : 'Tørt' }}</div>
            </div>
            <div>
              <div class="text-xs opacity-70">
                <fa-icon class="me-1" [icon]="icons.farWind" />
                Vind
              </div>
              <div class="text-lg tabular-nums">
                {{ latest.windSpeed | number: '1.1-1' }} m/s
                <!-- The arrow points where the wind blows, so away from where it comes from -->
                <fa-icon class="inline-block text-sm ms-1" [style.rotate.deg]="latest.windDirection + 180" [icon]="icons.farArrowUp" />
              </div>
              <div class="text-xs opacity-70">Fra {{ windFrom() }}</div>
            </div>
            <div>
              <div class="text-xs opacity-70">
                <fa-icon class="me-1" [icon]="icons.farDroplet" />
                Luftfugtighed
              </div>
              <div class="text-lg tabular-nums">{{ latest.humidity | number: '1.0-0' }} %</div>
            </div>
            <div>
              <div class="text-xs opacity-70">
                <fa-icon class="me-1" [icon]="icons.farGauge" />
                Lufttryk
              </div>
              <div class="text-lg tabular-nums">{{ latest.pressure | number: '1.0-0' }} hPa</div>
            </div>
          </div>
        } @else if (weather.error()) {
          <p>Vejret kunne ikke hentes</p>
        } @else {
          <p>Venter på vejret...</p>
        }
      </mat-card-content>
    </mat-card>
  `,
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, FaIconComponent, DecimalPipe],
})
export class LiveWeatherComponent {
  #live = inject(RaceResultProvider);

  race = input.required<IRace>();

  protected readonly icons = icon;
  protected readonly weather = rxResource({
    params: () => this.race(),
    stream: ({ params }) => this.#live.getWeather(params),
  });

  #value = valueOf(this.weather);
  #readings = computed<IWeatherReading[]>(() => this.#value() ?? []);
  protected readonly latest = computed(() => this.#readings().at(-1));

  /** The reading from when the race started, or the first one when there is none from before */
  #atStart = computed(() => {
    const start = this.race().raceStart;
    const readings = this.#readings();
    return readings.findLast(reading => reading.date <= start) ?? readings[0];
  });

  /** How much warmer it has become since the start, once the race has started */
  protected readonly change = computed(() => {
    const [latest, atStart] = [this.latest(), this.#atStart()];
    return latest && atStart && latest.date > this.race().raceStart
      ? { air: tenths(latest.airTemperature - atStart.airTemperature), track: tenths(latest.trackTemperature - atStart.trackTemperature) }
      : undefined;
  });

  protected readonly windFrom = computed(() => compass[Math.round((this.latest()?.windDirection ?? 0) / 45) % 8]);
}

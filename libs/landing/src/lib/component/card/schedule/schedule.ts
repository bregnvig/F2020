import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { RacesStore } from '@f2020/api';
import { IRace, RaceSessionType, sessionId, sessionName } from '@f2020/data';
import { FlagURLPipe, icon } from '@f2020/shared';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { DateTime } from 'luxon';
import { interval, map } from 'rxjs';

const sessionIcons: Record<RaceSessionType, IconProp> = {
  practice: icon.fasSteeringWheel,
  'sprint-qualifying': icon.farClock,
  qualifying: icon.farClock,
  sprint: icon.fasFlagCheckered,
  race: icon.fasFlagCheckered,
};

interface ScheduleSession {
  id: string;
  name: string;
  icon: IconProp;
  time: string;
  live: boolean;
  completed: boolean;
  /** Only on the next session */
  startsIn?: string;
}

interface ScheduleDay {
  date: string;
  sessions: ScheduleSession[];
}

@Component({
  selector: 'f2020-schedule',
  template: `
    @if (race(); as race) {
      <mat-card>
        <mat-card-header>
          <img mat-card-avatar width="40" height="40" [ngSrc]="race | flagURL" />
          <mat-card-title>{{ race.name }}</mat-card-title>
          <mat-card-subtitle>Weekendens program</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @for (day of days(); track day.date) {
            <h3 class="mt-4 mb-0 px-4 text-xs font-medium uppercase tracking-widest opacity-60">{{ day.date }}</h3>
            <mat-list>
              @for (session of day.sessions; track session.id) {
                @if (session.completed) {
                  <a mat-list-item class="opacity-50" [routerLink]="['race', race.round, 'session', session.id]">
                    <ng-container *ngTemplateOutlet="row; context: { $implicit: session }" />
                  </a>
                } @else {
                  <mat-list-item>
                    <ng-container *ngTemplateOutlet="row; context: { $implicit: session }" />
                  </mat-list-item>
                }
              }
            </mat-list>
          }
        </mat-card-content>
      </mat-card>
    }
    <ng-template #row let-session>
      <span class="flex flex-row justify-between items-center gap-4">
        <span class="flex flex-row items-center gap-4">
          <fa-icon class="w-6 text-center opacity-70" [icon]="session.icon" />
          <span class="flex flex-col">
            <span [class.font-bold]="session.live">{{ session.name }}</span>
            @if (session.startsIn) {
              <span class="text-xs opacity-70">{{ session.startsIn }}</span>
            }
          </span>
        </span>
        @if (session.live) {
          <span class="flex items-center gap-2 rounded-full py-1 px-3 text-sm font-medium bg-pink-600 text-white">
            <span class="size-2 rounded-full bg-white animate-pulse"></span>
            I gang
          </span>
        } @else if (session.completed) {
          <span class="py-1 px-3 text-sm">Resultat</span>
        } @else {
          <span class="rounded-full py-1 px-3 text-sm tabular-nums bg-white/10">{{ session.time }}</span>
        }
      </span>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatListModule, NgOptimizedImage, NgTemplateOutlet, RouterLink, FlagURLPipe, FaIconComponent],
  host: {
    '[hidden]': '!days().length',
  },
})
export class ScheduleComponent {
  /** Updated every minute, so a session is shown as completed when it ends */
  #now = toSignal(interval(60_000).pipe(map(() => DateTime.now())), { initialValue: DateTime.now() });

  protected readonly race: Signal<IRace | undefined> = inject(RacesStore).currentRace;
  protected readonly days = computed(() => {
    const now = this.#now();
    const sessions = this.race()?.schedule ?? [];
    const next = sessions.find(session => session.start > now);
    return sessions.reduce((days, session) => {
      const date = session.start.toFormat('cccc d. MMMM');
      const entry: ScheduleSession = {
        id: sessionId(session),
        name: sessionName(session),
        icon: sessionIcons[session.type],
        time: session.start.toFormat('HH:mm'),
        live: session.start <= now && session.end > now,
        completed: session.end <= now,
        startsIn: session === next ? session.start.toRelative({ base: now, locale: 'da' }) : undefined,
      };
      const day = days.at(-1);
      day?.date === date ? day.sessions.push(entry) : days.push({ date, sessions: [entry] });
      return days;
    }, [] as ScheduleDay[]);
  });
}

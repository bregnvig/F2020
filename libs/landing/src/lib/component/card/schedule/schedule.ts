import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { RacesStore } from '@f2020/api';
import { IRace, IRaceSession, isSessionLive, RaceSessionType, sessionId, sessionName } from '@f2020/data';
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
  /** To the times while the session is driven, and the result after. Missing before the session */
  link?: (string | number)[];
  /** Only on the next session */
  startsIn?: string;
}

/** The race and the qualifying have their own live pages. The other sessions are followed on the page of the session */
const link = (race: IRace, session: IRaceSession, now: DateTime): ScheduleSession['link'] => {
  if (isSessionLive(session, now) && session.type === 'race') return ['race', race.round, 'live'];
  if (isSessionLive(session, now) && session.type === 'qualifying') return ['race', race.round, 'live', 'qualify'];
  return session.start <= now ? ['race', race.round, 'session', sessionId(session)] : undefined;
};

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
            <mat-action-list>
              @for (session of day.sessions; track session.id) {
                <mat-list-item [class.opacity-50]="session.completed" [disabled]="!session.link" [routerLink]="session.link ?? null">
                  <fa-icon matListItemIcon class="text-center" [icon]="session.icon" />
                  <span matListItemTitle [class.font-bold]="session.live">{{ session.name }}</span>
                  @if (session.completed) {
                    <span matListItemLine>Se resultatet</span>
                  } @else if (session.live) {
                    <span matListItemLine>Følg tiderne live</span>
                  } @else if (session.startsIn) {
                    <span matListItemLine>{{ session.startsIn }}</span>
                  }
                  <span matListItemMeta class="self-center">
                    @if (session.live) {
                      <span class="flex items-center gap-2 rounded-full py-1 px-3 text-sm font-medium bg-pink-600 text-white">
                        <span class="size-2 rounded-full bg-white animate-pulse"></span>
                        I gang
                      </span>
                    } @else if (!session.completed) {
                      <span class="rounded-full py-1 px-3 text-sm tabular-nums bg-white/10">{{ session.time }}</span>
                    }
                  </span>
                </mat-list-item>
              }
            </mat-action-list>
          }
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: `
    /* Only a session that has started can be opened. The others are disabled, so they can't be activated, but read as normal */
    mat-action-list {
      --mat-list-list-item-disabled-label-text-opacity: 1;
      --mat-list-list-item-disabled-leading-icon-opacity: 1;
      --mat-list-list-item-disabled-trailing-icon-opacity: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatListModule, NgOptimizedImage, RouterLink, FlagURLPipe, FaIconComponent],
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
    const race = this.race();
    const sessions = race?.schedule ?? [];
    const next = sessions.find(session => session.start > now);
    return sessions.reduce((days, session) => {
      const date = session.start.toFormat('cccc d. MMMM');
      const entry: ScheduleSession = {
        id: sessionId(session),
        name: sessionName(session),
        icon: sessionIcons[session.type],
        time: session.start.toFormat('HH:mm'),
        live: isSessionLive(session, now),
        completed: session.end <= now,
        link: link(race, session, now),
        startsIn: session === next ? session.start.toRelative({ base: now, locale: 'da' }) : undefined,
      };
      const day = days.at(-1);
      day?.date === date ? day.sessions.push(entry) : days.push({ date, sessions: [entry] });
      return days;
    }, [] as ScheduleDay[]);
  });
}

import { inject, InjectionToken, Provider } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Session } from '@f2020/openf1';
import { requiredValue } from '@f2020/tools';
import { LiveQualifyService } from './live-qualify.service';
import { QualifyResultService } from './qualify-result.service';
import { isQualifyLive, qualifySessionData } from './qualify-session';
import { LiveSessionProvider } from './race-result.service';
import { ReplayQualifyService } from './replay-qualify.service';

export const QualifyResultProvider = new InjectionToken<QualifyResultService>('QualifyResultService');

/** Needs the qualifying session in the route data, from `qualifySessionResolver` */
export function provideQualifyResultService(): Provider[] {
  return [
    LiveQualifyService,
    ReplayQualifyService,
    {
      provide: QualifyResultProvider,
      useFactory: () => {
        const session: Session = requiredValue(inject(ActivatedRoute).snapshot.data[qualifySessionData], 'Qualifying session');
        return isQualifyLive(session) ? inject(LiveQualifyService) : inject(ReplayQualifyService);
      },
    },
    { provide: LiveSessionProvider, useExisting: QualifyResultProvider },
  ];
}

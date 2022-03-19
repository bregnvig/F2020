import { CommonModule } from '@angular/common';
import { InjectionToken, ModuleWithProviders, NgModule } from "@angular/core";
import 'firebase/app';
import firebase from 'firebase/compat/app';
import 'firebase/compat/functions';
import 'firebase/compat/messaging';
import { noop } from 'rxjs';

export const GoogleFunctions = new InjectionToken<firebase.functions.Functions>('GOOGLE_FUNCTIONS');
export const GoogleMessaging = new InjectionToken<firebase.messaging.Messaging>('GOOGLE_MESSAGING');

@NgModule({
  imports: [CommonModule],
})
export class FirebaseModule {

  static forRoot(pubKey: string): ModuleWithProviders<FirebaseModule> {
    return {
      ngModule: FirebaseModule,
      providers: [
        {
          provide: GoogleFunctions,
          useFactory: () => firebase.app().functions('europe-west1')
        },
        {
          provide: GoogleMessaging,
          useFactory: () => {
            try {
              const _messaging = firebase.messaging();
              // _messaging.usePublicVapidKey(pubKey);
              return _messaging;
            } catch {
              return {
                onMessage: noop
              };
            }
          }
        }
      ]
    };
  }

}

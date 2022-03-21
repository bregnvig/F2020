import { CommonModule } from '@angular/common';
import { InjectionToken, ModuleWithProviders, NgModule } from "@angular/core";
import { Messaging } from 'firebase/messaging';
import { noop } from 'rxjs';

export const GoogleMessaging = new InjectionToken<Messaging>('GOOGLE_MESSAGING');

@NgModule({
  imports: [CommonModule],
})
export class FirebaseModule {

  static forRoot(pubKey: string): ModuleWithProviders<FirebaseModule> {
    return {
      ngModule: FirebaseModule,
      providers: [
        {
          provide: GoogleMessaging,
          useFactory: () => {
            try {
              // const _messaging = firebase.messaging();
              // _messaging.usePublicVapidKey(pubKey);
              return undefined; //_messaging;
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

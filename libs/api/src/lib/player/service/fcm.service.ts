import { inject, Injectable } from '@angular/core';
import { getToken, Messaging } from '@angular/fire/messaging';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class FCMService {


  setupMessaging: () => Promise<void | string>;

  constructor() {

    const snackBar = inject(MatSnackBar);
    if (location.hostname === 'localhost') {
      this.setupMessaging = () => Promise.resolve();
    } else {
      const messaging = inject(Messaging);
      this.setupMessaging = (): Promise<void | string> => {
        if (Notification.permission === 'denied') {
          return Promise.reject('Notification permission denied');
        }
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            const isAlreadyGranted = Notification.permission === 'granted';
            (isAlreadyGranted
                ? Promise.resolve()
                : firstValueFrom(snackBar.open('Hvis du vil modtage påmindelse, løbsresultater etc, så skal du godkende at vi må sende notifikationer til dig 👍', 'OK').onAction())
            ).then(
              async () => {
                await navigator.serviceWorker.register('/assets/firebase-messaging-sw.js', {
                  type: 'module',
                }).then(serviceWorkerRegistration => getToken(messaging, {
                  serviceWorkerRegistration,
                }).then(token => {
                  isAlreadyGranted && console.debug('Already granted', token);
                  resolve(isAlreadyGranted ? undefined : token);
                }).catch(error => reject(error)));
              },
            );
          });
        });
      };
    }
  }

}

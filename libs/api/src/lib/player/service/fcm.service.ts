import { Injectable } from '@angular/core';
import { getToken, Messaging } from '@angular/fire/messaging';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class FCMService {
  constructor(private messaging: Messaging, private snackBar: MatSnackBar) {

  }

  async setupMessaging(): Promise<void | string> {
    if (Notification.permission === 'granted') {
      return Promise.resolve();
    } else if (Notification.permission === 'denied') {
      return Promise.reject('Notification permission denied');
    } else {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          firstValueFrom(this.snackBar.open('Hvis du vil modtage påmindelse, løbsresultater etc, så skal du godkende at vi må sende notifikationer til dig 👍', 'OK').onAction()).then(
            async () => {
              await navigator.serviceWorker.register('/assets/firebase-messaging-sw.js', {
                type: 'module',
              }).then(serviceWorkerRegistration => getToken(this.messaging, {
                serviceWorkerRegistration,
              }).then(token => resolve(token)))
                .catch(error => reject(error));
            },
          );
        });
      });
    }
  }
}

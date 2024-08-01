import { Component, effect, inject, isDevMode } from '@angular/core';
import { getToken } from '@angular/fire/messaging';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { DriversStore, PlayerStore, RacesStore, VersionService } from '@f2020/api';
import { icon, SidebarComponent } from '@f2020/shared';
import { getMessaging, onMessage } from 'firebase/messaging';
import { filter, first, switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'f2020-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [
    MatToolbarModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    SidebarComponent,
    RouterOutlet,
    FontAwesomeModule,
  ],
})
export class AppComponent {

  bars = icon.fasBars;
  readonly #playerStore = inject(PlayerStore);
  readonly #driverStore = inject(DriversStore);

  constructor(
    private racesStore: RacesStore,
    private updates: SwUpdate,
    private versionService: VersionService,
    private snackBar: MatSnackBar,
    private router: Router) {
    this.racesStore.loadRaces();
    this.racesStore.loadYourBid();
    const messaging = getMessaging();
    getToken(messaging, { vapidKey: environment.firebaseConfig.vapidKey }).then(
      currentToken => isDevMode() && console.log(currentToken),
      error => console.error('An error occurred while retrieving token', error.message),
    );
    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
    });
    this.checkForVersionUpdate();
    effect(() => {
      if (this.#playerStore.authorized()) {
        this.#driverStore.loadDrivers();
        this.checkForOutdatedVersion();
        const player = this.#playerStore.player();
        if (player.roles && player.roles.includes('player')) {
          if (this.router.url === '/info/roles') {
            this.router.navigate(['/']);
          }
          this.setupMessaging();
        } else {
          this.router.navigate(['info', 'roles']);
        }
      }
    }, { allowSignalWrites: true });
  }

  private checkForVersionUpdate() {
    this.updates.versionUpdates.pipe(
      filter(event => event.type === 'VERSION_READY'),
      first(),
      switchMap(() => this.snackBar.open('🤩 Ny version klar', 'OPDATER', { duration: 10000 }).onAction()),
      switchMap(() => this.updates.activateUpdate()),
      first(),
    ).subscribe(() => location.reload());
  }

  private checkForOutdatedVersion() {
    this.versionService.setVersion({
      ui: 2,
      api: 2,
    });
    this.versionService.versionOK$.pipe(
      first(),
    ).subscribe(ok => {
      if (!ok) {
        this.snackBar.open('😭 Din nuværende version er forældet. Du bliver nødt til at hente den nye version', 'OK').onAction().pipe(
          switchMap(() => this.updates.checkForUpdate()),
          switchMap(() => this.updates.activateUpdate()),
        ).subscribe(() => location.reload());
      }
    });
  }

  private setupMessaging() {
    if (Notification.permission === 'granted') {
      this.#playerStore.loadMessaging();
    } else if (Notification.permission === 'denied') {
      console.log('Messaging denied');
    } else {
      setTimeout(() => {
        this.snackBar.open('Hvis du vil modtage påmindelse, løbsresultater etc, så skal du godkende at vi må sende notifikationer til dig 👍', 'OK').onAction()
          .subscribe(() => this.#playerStore.loadMessaging());
      });
    }
  }
}

import { Component, OnInit, isDevMode } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { PlayerActions, PlayerFacade, RacesActions, RacesFacade, VersionService } from '@f2020/api';
import { Player } from '@f2020/data';
import { DriversActions, DriversFacade } from '@f2020/driver';
import { filterEquals, truthy } from '@f2020/tools';
import { getMessaging, onMessage } from 'firebase/messaging';
import { filter, first, startWith, switchMap } from 'rxjs/operators';
import { SidebarComponent } from '../../../../libs/shared/src/lib/component/sidebar/sidebar.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { getToken } from '@angular/fire/messaging';
import { environment } from '../environments/environment';

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
  ],
})
export class AppComponent implements OnInit {

  constructor(
    private playerFacade: PlayerFacade,
    private driverFacade: DriversFacade,
    private racesFacade: RacesFacade,
    private updates: SwUpdate,
    private versionService: VersionService,
    private snackBar: MatSnackBar,
    private router: Router) {
    playerFacade.dispatch(PlayerActions.loadPlayer());
    const messaging = getMessaging();
    getToken(messaging, { vapidKey: environment.firebaseConfig.vapidKey }).then(
      currentToken => isDevMode() && console.log(currentToken),
      error => console.error('An error occurred while retrieving token', error.message)
    );
    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
    });

  }

  ngOnInit() {
    this.playerFacade.authorized$.pipe(
      filter(authorized => authorized),
      switchMap(() => this.playerFacade.player$),
      startWith(null as Player),
      filterEquals(),
    ).subscribe(player => {
      if (player.roles && player.roles.includes('player')) {
        this.racesFacade.dispatch(RacesActions.loadRaces());
        this.driverFacade.dispatch(DriversActions.loadDrivers());
        if (this.router.url === '/info/roles') {
          this.router.navigate(['/']);
        }
        if (Notification.permission === "granted") {
          this.playerFacade.dispatch(PlayerActions.loadMessagingToken());
        } else if (Notification.permission === 'denied') {
          console.log('Messaging denied');
        } else {
          setTimeout(() => {
            this.snackBar.open('Hvis du vil modtage påmindelse, løbsresultater etc, så skal du godkende at vi må sende notifikationer til dig 👍', 'OK').onAction()
              .subscribe(() => this.playerFacade.dispatch(PlayerActions.loadMessagingToken()));
          });
        }
      } else {
        this.router.navigate(['info', 'roles']);
      }
    });
    this.updates.versionUpdates.pipe(
      filter(event => event.type === 'VERSION_READY'),
      first(),
      switchMap(() => this.snackBar.open('🤩 Ny version klar', 'OPDATER', { duration: 10000 }).onAction()),
      switchMap(() => this.updates.activateUpdate()),
      first(),
    ).subscribe(() => location.reload());
    this.versionService.setVersion({
      ui: 2,
      api: 2
    });
    this.playerFacade.authorized$.pipe(
      truthy(),
      first(),
      switchMap(() => this.versionService.versionOK$),
      first(),
    ).subscribe(ok => {
      if (!ok) {
        this.snackBar.open('😭 Din nuværende version er forældet. Du bliver nødt til at hente den nye version', "OK").onAction().pipe(
          switchMap(() => this.updates.checkForUpdate()),
          switchMap(() => this.updates.activateUpdate()),
        ).subscribe(() => location.reload());
      }
    });
    const messaing = getMessaging();
    onMessage(messaing, message => this.snackBar.open(message.notification.body, null, { duration: 2000 }));
  }
}

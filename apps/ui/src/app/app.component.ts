import { Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { PlayerActions, PlayerFacade, RacesActions, RacesFacade, VersionService } from '@f2020/api';
import { Player } from '@f2020/data';
import { DriversActions, DriversFacade } from '@f2020/driver';
import { GoogleMessaging } from '@f2020/firebase';
import { filterEquals, truthy } from '@f2020/tools';
import firebase from 'firebase/app';
import { filter, first, startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'f2020-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {

  constructor(
    @Inject(GoogleMessaging) private messaging: firebase.messaging.Messaging,
    private playerFacade: PlayerFacade,
    private driverFacade: DriversFacade,
    private racesFacade: RacesFacade,
    private updates: SwUpdate,
    private versionService: VersionService,
    private snackBar: MatSnackBar,
    private router: Router) {

  }

  ngOnInit() {
    this.playerFacade.unauthorized$.pipe(
      truthy(),
    ).subscribe(() => this.router.navigate(['login']));
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
    this.updates.available.pipe(
      switchMap(() => this.snackBar.open('🤩 Ny version klar', 'OPDATER', { duration: 10000 }).onAction()),
      switchMap(() => this.updates.activateUpdate()),
      first(),
    ).subscribe(() => location.reload());
    this.versionService.setVersion({
      ui: 2,
      api: 2
    });
    this.versionService.versionOK$.subscribe(ok => {
      if (!ok) {
        this.snackBar.open('😭 Din nuværende version er forældet. Du bliver nødt til at hente den nye version', "OK").onAction().pipe(
          switchMap(() => this.updates.checkForUpdate()),
          switchMap(() => this.updates.activateUpdate()),
        ).subscribe(() => location.reload());
      }
    });

    this.messaging.onMessage(message => this.snackBar.open(message.notification.body, null, { duration: 2000 }));
  }
}

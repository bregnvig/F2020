import { Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { RacesActions, RacesFacade, SeasonActions, SeasonFacade, VersionService } from '@f2020/api';
import { DriversActions, DriversFacade } from '@f2020/driver';
import { GoogleMessaging } from '@f2020/firebase';
import { PlayerFacade, PlayerActions } from '@f2020/player';
import { truthy } from '@f2020/tools';
import { filter, first, switchMap, startWith, pairwise, map, switchMapTo } from 'rxjs/operators';
import * as equal from 'fast-deep-equal/es6'
import { Player } from '@f2020/data';

@Component({
  selector: 'f2020-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {

  constructor(
    @Inject(GoogleMessaging) private messaging: firebase.messaging.Messaging,
    private seasonFacade: SeasonFacade,
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
      startWith(<Player> null),
      pairwise(),
      filter(([previous, current]) => !equal(previous, current)),
      map(([_, current]) => current)
    ).subscribe(player => {
      if (player.roles && player.roles.includes('player')) {
        this.seasonFacade.dispatch(SeasonActions.loadSeason());
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
    this.updates.activated.subscribe(activatedEvent => this.versionService.setVersion(activatedEvent.current.appData['version']));
    this.versionService.versionOK$.subscribe(ok => {
      if (!ok) {
        this.snackBar.open('😭 Din nuværende version er forældet. Du bliver nødt til at hente den nye version', "OK").onAction().pipe(
          switchMapTo(this.updates.checkForUpdate()),
        ).subscribe();
      }
    })

    this.messaging.onMessage(message => this.snackBar.open(message.notification.body, null, { duration: 2000 }));
  }
}

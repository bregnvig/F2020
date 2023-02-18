import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { ActivatedRoute, Params } from '@angular/router';
import { PlayersActions, PlayersApiService, PlayersFacade } from '@f2020/api';
import { Player, Role } from '@f2020/data';
import { AbstractSuperComponent } from '@f2020/shared';
import { truthy } from '@f2020/tools';
import { Observable } from 'rxjs';
import { first, pluck, switchMap, map } from 'rxjs/operators';

@Component({
  templateUrl: './edit-player.component.html',
  styleUrls: ['./edit-player.component.scss']
})
export class EditPlayerComponent extends AbstractSuperComponent implements OnInit {

  player$: Observable<Player>;
  fg: FormGroup;
  accountAndNames = accountAndNames;

  constructor(
    private facade: PlayersFacade,
    private route: ActivatedRoute,
    private playerService: PlayersApiService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.fg = this.fb.group({
      roles: this.fb.group({
        player: [],
        admin: [],
        bankAdmin: []
      }),
      migration: [],
      balance: [0, Validators.min(-100)]
    });
    this.player$ = this.facade.selectedPlayer$;
    this.route.params.pipe(
      pluck<Params, string>('id'),
      this.takeUntilDestroyed(),
    ).subscribe(uid => this.facade.dispatch(PlayersActions.selectPlayer({ uid })));
    this.player$.pipe(
      truthy(),
      first()
    ).subscribe(player => {
      this.fg.get('roles').patchValue({
        player: player.roles.includes('player'),
        admin: player.roles.includes('admin'),
        bankAdmin: player.roles.includes('bank-admin'),
      }, { emitEvent: false });
      this.fg.get('balance').patchValue(player.balance || 0, { emitEvent: false });
    });
    this.fg.get('migration').valueChanges.pipe(
      map(player => player.balance),
    ).subscribe(balance => this.fg.get('balance').patchValue(balance));
  }

  updateRoles() {
    const value = Object.values(this.fg.get('roles').value);
    const roles: Role[] = (['player', 'admin', 'bank-admin'] as Role[]).filter((_, index) => value[index]);
    this.player$.pipe(
      first(),
      switchMap(player => this.playerService.updatePlayer(player.uid, { roles: roles.length ? roles : ['anonymous'] })),
    ).subscribe(() => this.snackBar.open('Roller opdateret', null, { duration: 2000 }));
  }

  updateBalance() {
    const balance = this.fg.get('balance').value || 0;
    this.player$.pipe(
      first(),
      switchMap(player => this.playerService.updateBalance(player.uid, balance)),
    ).subscribe(() => this.snackBar.open(`Saldo opdateret til ${balance}`, null, { duration: 2000 }));
  }

  migrateAccount() {
    const playerName = this.fg.get('migration').value.playerName;
    if (playerName) {
      this.player$.pipe(
        first(),
        switchMap(player => this.playerService.migrateAccount(player.uid, playerName)),
      ).subscribe(() => this.snackBar.open('Migrering afsluttet', null, { duration: 2000 }));
    }
  }

}

const accountAndNames = [
  { playerName: 'flb', balance: 1699.00, name: 'Flemming Bregnvig' },
  { playerName: 'bookie', balance: -4.00, name: 'My Bookie' },
  { playerName: 'bartrup', balance: 1569.00, name: 'Michael Bartrup' },
  { playerName: 'ttp', balance: 195.00, name: 'Thomas T Pedersen' },
  { playerName: 'peter', balance: 429.00, name: 'Peter Thorup' },
  { playerName: 'nra', balance: 362.00, name: 'Niels Henrik Rasmussen' },
  { playerName: 'killerkim', balance: 0.00, name: 'Thomas Knudsen' },
  { playerName: 'palle', balance: 2103.00, name: 'Palle Bregnvig' },
  { playerName: 'mmathiesen', balance: 0.00, name: 'Morten Mathiesen' },
  { playerName: 'tnl', balance: 827.00, name: 'Thorbjørn Larsen' },
  { playerName: 'dalsten', balance: 20.00, name: 'Jesper Dalsten' },
  { playerName: 'mhoejte', balance: 83.00, name: 'Mogens Højte' },
  { playerName: 'nino', balance: 1675.00, name: 'Nino Stokbro Ag' },
  { playerName: 'fie', balance: 54.00, name: 'Anne Sofie Bregnvig' },
  { playerName: 'rusche', balance: 0.00, name: 'Christian Rusche' },
  { playerName: 'jacob', balance: 1325.00, name: 'Jacob Andersen' },
  { playerName: 'STR', balance: 0.00, name: 'Stefan Trabolt' },
  { playerName: 'jette', balance: 506.00, name: 'Jette Hansen' },
  { playerName: 'Alboreto', balance: 0.00, name: 'Claus Jessing' },
  { playerName: 'katrine', balance: 0.00, name: 'Katrine Jensen' },
  { playerName: 'laier', balance: 0.00, name: 'Morten Laier' },
  { playerName: 'heidemeister', balance: 140.00, name: 'Michael Heide' },
  { playerName: 'henrik', balance: 289.00, name: 'Henrik Aakjær' },
  { playerName: 'kaare', balance: 0.00, name: 'Kåre Pedersen' },
  { playerName: 'steffen', balance: 80.00, name: 'Steffen Larsen' },
  { playerName: 'bruun', balance: 120.00, name: 'Søren Bruun' },
  { playerName: 'weile', balance: 40.00, name: 'Michael Weile' },
  { playerName: 'mathias', balance: 40.00, name: 'Mathias Lorenz' },
  { playerName: 'brian', balance: 0.00, name: 'Brian Hjorth' },
  { playerName: 'bakkekammen', balance: 0.00, name: 'Michael Christensen' },
  { playerName: 'tobias', balance: 0.00, name: 'Tobias Tvarnø' },
];
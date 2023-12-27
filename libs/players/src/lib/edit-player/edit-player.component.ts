import { Component, effect, OnInit, Signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { PlayersApiService, PlayersStore } from '@f2020/api';
import { Player, Role } from '@f2020/data';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { CardPageComponent, LoadingComponent } from '@f2020/shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';

@UntilDestroy()
@Component({
  templateUrl: './edit-player.component.html',
  styleUrls: ['./edit-player.component.scss'],
  standalone: true,
  imports: [NgIf, MatToolbarModule, CardPageComponent, ReactiveFormsModule, MatCardModule, MatCheckboxModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, NgFor, MatOptionModule, LoadingComponent, AsyncPipe],
})
export class EditPlayerComponent implements OnInit {

  player: Signal<Player>;
  fg: FormGroup;

  constructor(
    private store: PlayersStore,
    private route: ActivatedRoute,
    private service: PlayersApiService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.fg = this.fb.group({
      roles: this.fb.group({
        player: [],
        admin: [],
        bankAdmin: [],
      }),
    });
    this.player = this.store.player;
    this.route.params.pipe(
      map(params => params['id']),
      untilDestroyed(this),
    ).subscribe(uid => this.store.setPlayer(uid));
    effect(() => {
      this.fg.get('roles').patchValue({
        player: this.player().roles.includes('player'),
        admin: this.player().roles.includes('admin'),
        bankAdmin: this.player().roles.includes('bank-admin'),
      }, { emitEvent: false });
    });
  }

  updateRoles() {
    const value = Object.values(this.fg.get('roles').value);
    const roles: Role[] = (['player', 'admin', 'bank-admin'] as Role[]).filter((_, index) => value[index]);
    this.service.updatePlayer(this.player().uid, { roles: roles.length ? roles : ['anonymous'] }).then(
      () => this.snackBar.open('Roller opdateret', null, { duration: 2000 }),
    );
  }

}

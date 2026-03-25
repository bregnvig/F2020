import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Player } from '@f2020/data';
import { AccountService } from '../../service';
import { DepositDialogComponent } from '../deposit-dialog/deposit-dialog.component';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatOption } from '@angular/material/core';
import { CurrencyPipe } from '@angular/common';
import { MatSelect } from '@angular/material/select';
import { PlayersStore } from '@f2020/api';

@Component({
  templateUrl: './transfer-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogTitle, MatDialogContent, MatFormField, CurrencyPipe, MatSelect, MatOption, MatLabel, MatInput, MatDialogActions, MatButton, MatDialogClose],
})
export class TransferDialogComponent {

  readonly #fb = inject(FormBuilder);
  readonly #dialogRef = inject(MatDialogRef<DepositDialogComponent>);
  readonly #service = inject(AccountService);
  readonly #store = inject(PlayersStore);

  players = computed(() => this.#store.players().filter(p => p.uid !== this.data.player.uid));
  data = inject<{ player: Player; }>(MAT_DIALOG_DATA);

  fg = this.#fb.group({
    to: this.#fb.control<Player>(null, Validators.required),
    amount: this.#fb.control<number>(0, [Validators.required, Validators.min(0), Validators.max(Math.max(0, this.data.player.balance))]),
    message: this.#fb.control('', Validators.required),
  });


  onWithdraw() {
    const { amount, message, to } = this.fg.value;
    this.#dialogRef.close(this.#service.transfer(this.data.player.uid, to.uid, amount, message).then(() => ({ to, amount })));
  }

}

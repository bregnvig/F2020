import { Component, computed, Inject, OnInit, Signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Player } from '@f2020/data';
import { AccountService } from '../../service';
import { DepositDialogComponent } from '../deposit-dialog/deposit-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { AsyncPipe, CurrencyPipe, NgFor } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PlayersStore } from '@f2020/api';

@Component({
  templateUrl: './transfer-dialog.component.html',
  styleUrls: ['./transfer-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, NgFor, MatOptionModule, MatInputModule, MatButtonModule, AsyncPipe, CurrencyPipe],
})
export class TransferDialogComponent implements OnInit {
  fg: FormGroup;
  players: Signal<Player[]>;

  constructor(
    private dialogRef: MatDialogRef<DepositDialogComponent>,
    private service: AccountService,
    private store: PlayersStore,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { player: Player; }) {
  }

  onWithdraw() {
    const { amount, message, to } = this.fg.value;
    this.dialogRef.close(this.service.transfer(this.data.player.uid, to.uid, amount, message).then(() => ({ to, amount })));
  }

  ngOnInit(): void {
    this.players = computed(() => this.store.players().filter(p => p.uid !== this.data.player.uid));
    this.fg = this.fb.group({
      to: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(0), Validators.max(Math.max(0, this.data.player.balance))]],
      message: [null, Validators.required],
    });
  }
}

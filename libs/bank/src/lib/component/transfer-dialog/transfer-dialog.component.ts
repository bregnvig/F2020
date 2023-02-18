import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Player } from '@f2020/data';
import { PlayersFacade } from '@f2020/api';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AccountService } from '../../service';
import { DepositDialogComponent } from '../deposit-dialog/deposit-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  templateUrl: './transfer-dialog.component.html',
  styleUrls: ['./transfer-dialog.component.scss']
})
export class TransferDialogComponent implements OnInit {
  fg: FormGroup;
  players$: Observable<Player[]>;

  constructor(
    private dialogRef: MatDialogRef<DepositDialogComponent>,
    private service: AccountService,
    private facade: PlayersFacade,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { player: Player; }) { }

  onWithdraw() {
    const { amount, message, to } = this.fg.value;
    this.dialogRef.close(this.service.transfer(this.data.player.uid, to.uid, amount, message).then(() => ({ to, amount })));
  }

  ngOnInit(): void {
    this.players$ = this.facade.allPlayers$.pipe(
      map(players => (players || []).filter(p => p.uid !== this.data.player.uid))
    );
    this.fg = this.fb.group({
      to: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(0), Validators.max(Math.max(0, this.data.player.balance))]],
      message: [null, Validators.required]
    });
  }
}

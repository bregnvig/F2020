import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { DepositDialogComponent } from '../deposit-dialog/deposit-dialog.component';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { AccountService } from '../../service';
import { Player } from '@f2020/data';

@Component({
  templateUrl: './withdraw-dialog.component.html',
  styleUrls: ['./withdraw-dialog.component.scss']
})
export class WithdrawDialogComponent implements OnInit {
  fg: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<DepositDialogComponent>,
    private service: AccountService,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { player: Player }) { }

  onWithdraw() {
    const { amount, message } = this.fg.value
    this.dialogRef.close(this.service.withdraw(this.data.player.uid, amount, message || 'Udbetalt via MobilePay').then(() => amount));
  }

  ngOnInit(): void {
    this.fg = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0), Validators.max(Math.max(0, this.data.player.balance))]],
      message: []
    })
  }
}

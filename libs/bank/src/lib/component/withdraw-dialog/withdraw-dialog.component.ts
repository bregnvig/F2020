import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { DepositDialogComponent } from '../deposit-dialog/deposit-dialog.component';
import { AccountService } from '../../service';
import { Player } from '@f2020/data';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    templateUrl: './withdraw-dialog.component.html',
    styleUrls: ['./withdraw-dialog.component.scss'],
    standalone: true,
    imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, CurrencyPipe]
})
export class WithdrawDialogComponent implements OnInit {
  fg: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<DepositDialogComponent>,
    private service: AccountService,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { player: Player; }) { }

  onWithdraw() {
    const { amount, message } = this.fg.value;
    this.dialogRef.close(this.service.withdraw(this.data.player.uid, amount, message || 'Udbetalt via MobilePay').then(() => amount));
  }

  ngOnInit(): void {
    this.fg = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0), Validators.max(Math.max(0, this.data.player.balance))]],
      message: []
    });
  }
}

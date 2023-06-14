import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Player } from '@f2020/data';
import { AccountService } from '../../service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    templateUrl: './deposit-dialog.component.html',
    styleUrls: ['./deposit-dialog.component.scss'],
    standalone: true,
    imports: [MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule]
})
export class DepositDialogComponent implements OnInit {

  fg: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<DepositDialogComponent>,
    private service: AccountService,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { player: Player; }) { }

  onDeposit() {
    const { amount, message } = this.fg.value;
    this.dialogRef.close(this.service.deposit(this.data.player.uid, amount, message || 'Via MobilePay').then(() => amount));
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.fg = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0)]],
      message: []
    });
  }

}

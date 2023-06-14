import { Directive } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Subject, Subscription } from 'rxjs';

@UntilDestroy({ arrayName: 'subscriptions' })
@Directive()
export abstract class AbstractControlComponent<T> implements ControlValueAccessor {


  protected subscriptions: Subscription[] = [];
  protected destroyed$ = new Subject<boolean>();

  private queue: any[] = [];
  private _propagateChange: (_: T) => any;
  private _propagateTouched: (_?: any) => any;
  private readonly _uniqueId: string;

  constructor() {
  }

  onBlur() {
    if (this.propagateTouched) {
      this.propagateTouched();
    }
  }

  registerOnChange(fn: any): void {
    this._propagateChange = fn;
    if (this.queue.length) {
      let value;
      while (value = this.queue.shift()) {
        this.propagateChange(value);
      }
    }
  }

  registerOnTouched(fn: any): void {
    this._propagateTouched = fn;
  }

  protected propagateChange(_: any): void {
    if (this._propagateChange) {
      this._propagateChange(_);
    } else {
      this.queue.push(_);
    }
  }

  protected propagateTouched(): void {
    if (this._propagateTouched) {
      this._propagateTouched();
    }
  }

  abstract writeValue(value: T): void;

  abstract markAllTouched(): void;

}

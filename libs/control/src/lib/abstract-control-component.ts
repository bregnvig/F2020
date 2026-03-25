import { Directive } from '@angular/core';
import { AbstractControl, ControlValueAccessor } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Directive()
export abstract class AbstractControlComponent<T> implements ControlValueAccessor {

  private queue: any[] = [];
  private _propagateChange: (_: T) => any;
  private _propagateTouched: (_?: any) => any;
  private readonly _uniqueId: string;

  #setDisabledState: (_: boolean) => void;
  #markAllTouched: () => void;

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

  setDisabledState(isDisabled: boolean): void {
    this.#setDisabledState?.(isDisabled);
  }

  markAllTouched(): void {
    this.#markAllTouched?.();
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

  protected setupStandardControl(control: AbstractControl): void {
    this.#setDisabledState = (isDisabled: boolean) => {
      if (control.disabled === isDisabled || control.enabled === !isDisabled) return;
      isDisabled ? control.disable() : control.enable();
    };
    this.#markAllTouched = () => control.markAllAsTouched();
  }
}

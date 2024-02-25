import { Signal, signal, WritableSignal } from '@angular/core';
import { deepCompare, TypedObject } from '@f2020/tools';


export abstract class Store<S extends object> {


  private readonly _state: { [P in keyof S]: WritableSignal<S[P]> };

  protected constructor(initialState: S) {

    this._state = new Proxy({} as typeof this._state, {
      get: (target, prop) => {
        !target[prop] && (target[prop] = signal(undefined)); // Add new state if not already present
        return target[prop];
      },
      apply(target: { [P in keyof S]: WritableSignal<S[P]> }, thisArg: any, argArray: any[]): any {
      },
    });
    this.setState(() => initialState);
  }

  get state(): Readonly<{ [P in keyof S]: Signal<S[P]> }> {
    return this._state;
  }

  // Reducer
  setState(
    fn: () => Partial<S>,
  ): void {
    const state = fn();
    TypedObject.entries(state).forEach(([key, value]) => {
      const prop = this._state[key];
      const previousValue = prop();
      deepCompare(previousValue, value) || prop.set(value);
    });
  }
}

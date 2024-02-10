import { Signal, signal, WritableSignal } from '@angular/core';
import { TypedObject } from '@f2020/tools';


export abstract class Store<S extends object> {


  private readonly _state: { [P in keyof S]: WritableSignal<S[P]> };

  protected constructor(initialState: S) {

    this._state = new Proxy({} as typeof this._state, {
      set: (target, prop, value) => {
        !target[prop] && (target[prop] = signal(undefined)); // Add new state if not already present
        target[prop].set(value);
        return undefined;
      },
      get: (target, prop) => {
        !target[prop] && (target[prop] = signal(undefined)); // Add new state if not already present
        return target[prop];
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
      this._state[key].set(value);
    });
  }

}

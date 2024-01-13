import { computed, Signal, signal, WritableSignal } from '@angular/core';

export abstract class Store<S> {

  private readonly _state: WritableSignal<S>;

  protected constructor(initialState: S) {
    this._state = signal(initialState);
  }

  get state(): Signal<S> {
    return this._state;
  }

  // Reducer
  setState<K extends keyof S, E extends Partial<Pick<S, K>>>(
    fn: (state: S) => E,
  ): void {
    const state = fn(this.state());
    this._state.set(({ ...this.state(), ...state }));
  }

  // Common selector you could consider this being private
  select<T>(selector: (state: S) => T): Signal<T> {
    return computed(() => selector(this._state()));
  }

}

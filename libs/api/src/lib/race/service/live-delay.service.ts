import { Service, signal } from '@angular/core';

const storageKey = 'liveDelay';
export const maxLiveDelay = 120;

const clamp = (seconds: number) => Math.min(Math.max(Math.round(seconds), 0), maxLiveDelay);

const stored = () => {
  try {
    return clamp(Number(localStorage.getItem(storageKey)) || 0);
  } catch {
    return 0;
  }
};

/**
 * How many seconds the live data is held back, so it is in step with a TV that is behind OpenF1. The TV depends on the device,
 * so the delay is stored in the browser and not on the player
 */
@Service()
export class LiveDelayService {
  readonly #seconds = signal(stored());
  readonly seconds = this.#seconds.asReadonly();
  readonly milliseconds = () => this.#seconds() * 1000;

  set(seconds: number) {
    this.#seconds.set(clamp(seconds));
    try {
      localStorage.setItem(storageKey, String(this.#seconds()));
    } catch {
      // The delay is only kept for the page then
    }
  }
}

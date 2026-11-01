import { DOCUMENT, effect, inject, Service, signal } from '@angular/core';
import { ColorScheme } from '@f2020/data';
import { PlayerStore } from '../player/+state';

/** Also read by the script in index.html, so the page has the right colours before the app has loaded */
const colorSchemeKey = 'color-scheme';

const surfaces = { light: '#fff8f8', dark: '#171213' };

/**
 * Light, dark or as the device. The choice is stored on the player, so it follows them, and on the device, so it is there before the
 * player is loaded
 */
@Service()
export class ColorSchemeService {
  readonly #document = inject(DOCUMENT);
  readonly #player = inject(PlayerStore).player;
  readonly #media = this.#document.defaultView!.matchMedia('(prefers-color-scheme: dark)');
  readonly #deviceDark = signal(this.#media.matches);
  readonly #scheme = signal((localStorage.getItem(colorSchemeKey) as ColorScheme | null) ?? 'system');

  readonly scheme = this.#scheme.asReadonly();

  constructor() {
    this.#media.addEventListener('change', event => this.#deviceDark.set(event.matches));
    effect(() => {
      const scheme = this.#player()?.colorScheme;
      if (scheme) {
        this.#scheme.set(scheme);
      }
    });
    effect(() => {
      const scheme = this.#scheme();
      localStorage.setItem(colorSchemeKey, scheme);
      this.#apply(scheme === 'system' ? (this.#deviceDark() ? 'dark' : 'light') : scheme, scheme === 'system');
    });
  }

  set(scheme: ColorScheme) {
    this.#scheme.set(scheme);
  }

  /** The Material theme follows color-scheme, and the dark: classes of Tailwind follow the dark class */
  #apply(shown: 'light' | 'dark', system: boolean) {
    const root = this.#document.documentElement;
    root.style.colorScheme = system ? 'light dark' : shown;
    root.classList.toggle('dark', shown === 'dark');
    this.#document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => (meta.content = surfaces[shown]));
  }
}

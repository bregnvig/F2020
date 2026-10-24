import { DOCUMENT, inject, InjectionToken, Service, signal } from '@angular/core';

/** The Google Analytics measurement id. Only the production build provides one, so development is never tracked */
export const ANALYTICS_ID = new InjectionToken<string | undefined>('ANALYTICS_ID', { factory: () => undefined });

export type AnalyticsConsent = 'granted' | 'denied';

const consentKey = 'analytics-consent';

type AnalyticsWindow = Window & { dataLayer?: unknown[] } & Record<string, unknown>;

/** Google Analytics is only loaded once the player has accepted it, as it sets cookies */
@Service()
export class AnalyticsService {
  readonly #id = inject(ANALYTICS_ID);
  readonly #document = inject(DOCUMENT);
  readonly #window = this.#document.defaultView as unknown as AnalyticsWindow;
  readonly #consent = signal(localStorage.getItem(consentKey) as AnalyticsConsent | null);
  #loaded = false;

  readonly enabled = !!this.#id;
  readonly consent = this.#consent.asReadonly();

  constructor() {
    if (this.#consent() === 'granted') {
      this.#start();
    }
  }

  setConsent(granted: boolean) {
    const consent: AnalyticsConsent = granted ? 'granted' : 'denied';
    localStorage.setItem(consentKey, consent);
    this.#consent.set(consent);
    if (granted) {
      this.#start();
    } else {
      this.#stop();
    }
  }

  #start() {
    if (!this.#id) {
      return;
    }
    this.#window[`ga-disable-${this.#id}`] = false;
    if (this.#loaded) {
      return;
    }
    this.#loaded = true;
    const dataLayer = (this.#window.dataLayer ??= []);
    // gtag.js only accepts the arguments object, not an array
    const gtag: (...args: unknown[]) => void = function () {
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    };
    gtag('js', new Date());
    gtag('config', this.#id);
    const script = this.#document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.#id}`;
    this.#document.head.append(script);
  }

  /** Stops sending data and removes the cookies. They are set on the top domain, so every parent domain is tried */
  #stop() {
    if (!this.#id) {
      return;
    }
    this.#window[`ga-disable-${this.#id}`] = true;
    const parts = this.#document.location.hostname.split('.');
    const domains = parts.map((_, i) => parts.slice(i).join('.'));
    this.#document.cookie
      .split(';')
      .map(cookie => cookie.split('=')[0].trim())
      .filter(name => name.startsWith('_ga'))
      .forEach(name => domains.forEach(domain => (this.#document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`)));
  }
}

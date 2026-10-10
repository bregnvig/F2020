import { inject, OnDestroy, Service } from '@angular/core';
import { Interval, Lap, PitStop, Position, RaceControl, Stint, TeamRadio } from '@f2020/openf1';
import mqtt, { MqttClient } from 'mqtt';
import { BehaviorSubject, catchError, EMPTY, Observable, retry, Subject, Subscription, tap } from 'rxjs';
import { OpenF1HttpService } from './openf1-http.service';
import { firestoreWebUtils } from '../../firestore-utils';

const websocketUrl = 'wss://mqtt.openf1.org:8084/mqtt';
const reconnectPeriod = 5000;
const textDecoder = new TextDecoder();

/** MQTT 3.1.1 CONNACK return codes for a refused username or password, e.g. an expired token */
const authErrorCodes = new Set([4, 5]);

const topics = {
  laps: 'v1/laps',
  positions: 'v1/position',
  intervals: 'v1/intervals',
  radio: 'v1/team_radio',
  pitStops: 'v1/pit',
  raceControl: 'v1/race_control',
  stints: 'v1/stints',
};

@Service({ autoProvided: false })
export class OpenF1WSSService implements OnDestroy {

  #openF1Http = inject(OpenF1HttpService);
  #laps = new BehaviorSubject<Lap | undefined>(undefined);
  #positions = new BehaviorSubject<Position | undefined>(undefined);
  #intervals = new BehaviorSubject<Interval | undefined>(undefined);
  #pitStops = new BehaviorSubject<PitStop | undefined>(undefined);
  #radio = new BehaviorSubject<TeamRadio | undefined>(undefined);
  #raceControl = new BehaviorSubject<RaceControl | undefined>(undefined);
  #stints = new BehaviorSubject<Stint | undefined>(undefined);
  #client: MqttClient | null = null;
  #tokenRequest?: Subscription;

  #topicSubjects: Record<string, Subject<any>> = {
    [topics.laps]: this.#laps,
    [topics.positions]: this.#positions,
    [topics.intervals]: this.#intervals,
    [topics.radio]: this.#radio,
    [topics.pitStops]: this.#pitStops,
    [topics.raceControl]: this.#raceControl,
    [topics.stints]: this.#stints,
  };

  laps$ = this.#laps.asObservable();
  positions$ = this.#positions.asObservable();
  intervals$ = this.#intervals.asObservable();
  pitStops$ = this.#pitStops.asObservable();
  radio$ = this.#radio.asObservable();
  raceControl$ = this.#raceControl.asObservable();
  stints$ = this.#stints.asObservable();

  ngOnDestroy(): void {
    this.#tokenRequest?.unsubscribe();
    // The 'true' flag forces a disconnection without waiting for the offline queue
    this.#client?.end(true, () => console.debug('MQTT client disconnected'));
    this.#client = null;
  }

  /** Connects once. mqtt.js reconnects by itself when the connection drops */
  initializeClient() {
    if (this.#client) {
      return;
    }

    const client = mqtt.connect(websocketUrl, {
      username: 'flemming@bregnvig.dk',
      // Connect when the token has been fetched
      manualConnect: true,
      reconnectPeriod,
      connectTimeout: 10_000,
      reconnectOnConnackError: true,
      // The topics are subscribed on every connect instead
      resubscribe: false,
    });
    client.on('connect', () => {
      console.debug('MQTT client connected');
      client.subscribe(Object.values(topics), err => err && console.error('Failed to subscribe to the OpenF1 topics', err));
    });
    client.on('offline', () => console.debug(`MQTT client offline, reconnecting every ${reconnectPeriod / 1000} seconds`));
    client.on('error', err => {
      // The browser build of mqtt doesn't export ErrorWithReasonCode, so the code is checked instead
      if ('code' in err && typeof err.code === 'number' && authErrorCodes.has(err.code)) {
        console.debug('MQTT client refused, refreshing the token before the next reconnect');
        this.#refreshToken(client);
        return;
      }
      console.error('MQTT client error:', err);
    });
    client.on('message', (topic, message) => this.#handleMessage(topic, message));
    this.#client = client;
    this.#tokenRequest = this.#updatePassword(client).subscribe(() => client.connect());
  }

  #refreshToken(client: MqttClient) {
    if (this.#tokenRequest && !this.#tokenRequest.closed) {
      return;
    }
    this.#tokenRequest = this.#updatePassword(client).subscribe();
  }

  #updatePassword(client: MqttClient): Observable<string> {
    return this.#openF1Http.getToken().pipe(
      retry({ count: 5, delay: reconnectPeriod }),
      tap(token => client.options.password = token),
      catchError(error => {
        console.error('Failed to get an OpenF1 token for MQTT', error);
        return EMPTY;
      }),
    );
  }

  #handleMessage(topic: string, message: Uint8Array) {
    const subject = this.#topicSubjects[topic];
    if (!subject) {
      console.warn(`No handler for topic ${topic}`);
      return;
    }
    try {
      subject.next(firestoreWebUtils.convertJSONDates(JSON.parse(textDecoder.decode(message))));
    } catch (error) {
      console.error(`Failed to parse a message on ${topic}`, error);
    }
  }
}

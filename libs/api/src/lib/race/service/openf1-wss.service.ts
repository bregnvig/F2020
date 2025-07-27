import { inject, Injectable, OnDestroy } from '@angular/core';
import { firestoreWebUtils } from '@f2020/data';
import { Lap, PitStop, Position, TeamRadio } from '@f2020/openf1';
import mqtt, { MqttClient } from 'mqtt';
import { BehaviorSubject, Subject } from 'rxjs';
import { OpenF1HttpService } from './openf1-http.service';

// mqtt-reason-codes.enum.ts

export enum MqttReasonCode {
  Success = 0,
  // 1-127 are reserved
  UnspecifiedError = 128,
  MalformedPacket = 129,
  ProtocolError = 130,
  ImplementationSpecificError = 131,
  NotAuthorized = 135,
  ServerBusy = 137,
  BadAuthenticationMethod = 140,
  TopicNameInvalid = 144,
  PacketTooLarge = 149,
  QuotaExceeded = 151,
  PayloadFormatInvalid = 153,
  ServerUnavailable = 18,
  // Custom or less common codes can be added here
  // The user was asking for code 4, which is from MQTT 3.1.1
  // In MQTT v5 this is covered by other codes like 135 (Not Authorized)
  // For compatibility or specific broker implementations, you might handle older codes.
  // MQTT v3.1.1 Connection Refused Codes:
  ConnectionRefusedUnacceptableProtocolVersion = 1,
  ConnectionRefusedIdentifierRejected = 2,
  ConnectionRefusedServerUnavailable = 3,
  ConnectionRefusedBadUserNameOrPassword = 4,
  ConnectionRefusedNotAuthorizedV3 = 5,
}

const websocketUrl = 'wss://mqtt.openf1.org:8084/mqtt';

const topics = {
  laps: 'v1/laps',
  positions: 'v1/position',
  radio: 'v1/team_radio',
  pitStops: 'v1/pit',
};

@Injectable()
export class OpenF1WSSService implements OnDestroy {

  #openF1Http = inject(OpenF1HttpService);
  #laps = new BehaviorSubject<Lap | undefined>(undefined);
  #positions = new BehaviorSubject<Position | undefined>(undefined);
  #pitStops = new BehaviorSubject<PitStop | undefined>(undefined);
  #radio = new BehaviorSubject<TeamRadio | undefined>(undefined);
  #client: MqttClient | null = null;

  #isResetting = false;
  #topicSubjects: Record<string, Subject<any>> = {
    [topics.laps]: this.#laps,
    [topics.positions]: this.#positions,
    [topics.radio]: this.#radio,
    [topics.pitStops]: this.#pitStops,
  };

  laps$ = this.#laps.asObservable();
  positions$ = this.#positions.asObservable();
  pitStops$ = this.#pitStops.asObservable();
  radio$ = this.#radio.asObservable();

  constructor() {
    this.#initializeClient();
  }

  ngOnDestroy(): void {
    this.#disconnectClient();
  }

  #initializeClient() {
    if (this.#client?.connected) {
      console.debug('OpenF1WSSService already connected');
      return;
    }

    this.#openF1Http.getToken().subscribe(token => {
      this.#isResetting = false;
      this.#client = mqtt.connect(websocketUrl, {
        username: 'flemming@bregnvig.dk',
        password: token,
        reconnectPeriod: 0,
      });
      this.#client.on('connect', () => {
        console.debug('MQTT Client connected');
        Object.values(topics).forEach(topic => this.#client.subscribe(topic, err => err && console.error(`Failed to subscribe to ${token}`, err)));
      });
      this.#client.on('error', err => {
        if ('code' in err && err.code === MqttReasonCode.ConnectionRefusedBadUserNameOrPassword) {
          this.#refreshTokenAndReconnect();
          return;
        }
        console.error('MQTT Client error:', err);
      });
      this.#client.on('message', (topic, message) => {
        const data = JSON.parse(message.toString());
        const subject = this.#topicSubjects[topic];
        if (subject) {
          subject.next(firestoreWebUtils.convertJSONDates(data));
        } else {
          console.warn(`No handler for topic ${topic}`, data);
        }
      });
      this.#client.on('close', () => {
        console.debug('MQTT Client connection closed');
        this.#disconnectClient();
      });
    });
  }

  #disconnectClient(): void {
    if (this.#client) {
      console.debug('Disconnecting existing client...');
      // The 'true' flag forces a disconnection without waiting for offline queue.
      this.#client.end(true, () => console.debug('MQTT Client disconnected.'));
      this.#client.removeAllListeners();
      this.#client = null;
    }
  }

  #refreshTokenAndReconnect = (): void => {
    if (this.#isResetting) {
      console.debug('Already resetting, skipping new reset request.');
      return;
    }
    console.debug('Attempting to refresh token and reconnect...');
    this.#isResetting = true;
    this.#disconnectClient();
    // A small delay to ensure the old connection is fully closed.
    setTimeout(() => this.#initializeClient(), 100);
  };
}

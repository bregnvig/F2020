// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// This is not a real firebase project. This is just for development and testing purposes.
export const environment = {
  production: false,
  useEmulator: true,
  firebaseConfig: {
    apiKey: 'AIzaSyAZhIDMYcYt01mE3ApPkNBiJqYWpZXqPFQ',
    authDomain: 'f1-playground-e1f23.firebaseapp.com',
    projectId: 'f1-playground-e1f23',
    storageBucket: 'f1-playground-e1f23.appspot.com',
    messagingSenderId: '212314334893',
    appId: '1:212314334893:web:547033c359f88d07e4c824',
    vapidKey: 'BGp23_rQ4NemIAk3-w2rQGcBnKY7GGtsbwfoyH6xnrB3W5FTWOXY195rAnzJwmutHadvZVxzBy4Xc-5yrgbkRe0',
  },
  initialBid: {
    qualify: ['hamilton', 'bottas', 'leclerc', 'vettel', 'max_verstappen', 'albon'],
    fastestDriver: ['hamilton'],
    podium: ['hamilton', 'bottas', 'leclerc'],
    selectedDriver: {
      grid: 10,
      finish: 20,
    },
    firstCrash: ['hamilton'],
    polePositionTime: 72332,
  } as Bid,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import { Bid } from '@f2020/data';

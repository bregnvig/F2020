// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyCY1hzs-V5b4f4Zx3yBzBAiawiqr4JaSjQ",
    authDomain: "f1-serverless.firebaseapp.com",
    databaseURL: "https://f1-serverless.firebaseio.com",
    projectId: "f1-serverless",
    storageBucket: "f1-serverless.appspot.com",
    messagingSenderId: "657968084413",
    appId: "1:657968084413:web:9a4fa397037ae453df4ed4",
    measurementId: "G-Q2XDV9KH10"
  },
  messaging: {
    pubKey: 'BEKUF0EpZE-5I7XkoF_d35UIWTgTk7kYALgG4zWSPjoNinzKhQxxBCPanSFdzp3rnWjymIe5muXXYUE8ZfA_wLo'
  },
  initialBid: {
    qualify: ['hamilton', 'bottas', 'leclerc', 'vettel', 'max_verstappen', 'albon'],
    fastestDriver: ['hamilton'],
    podium: ['hamilton', 'bottas', 'leclerc'],
    selectedDriver: {
      grid: 10,
      finish: 20
    },
    firstCrash: ['hamilton'],
    polePositionTime: 72332
  } as Bid
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import 'zone.js/dist/zone-error';  // Included with Angular CLI.
import { Bid } from '@f2020/data';


import localeDa from '@angular/common/locales/da';
import { APP_INITIALIZER, enableProdMode, importProvidersFrom, LOCALE_ID } from '@angular/core';

import { DatePipe, registerLocaleData } from '@angular/common';
import { provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { connectFunctionsEmulator, getFunctions, provideFunctions } from '@angular/fire/functions';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { RaceApiModule } from '@f2020/api';
import { DateTimePipe, initializeFontAwesomeFactory } from '@f2020/shared';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { initializeApp } from 'firebase/app';
import 'firebase/auth';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import 'firebase/firestore';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { Settings } from 'luxon';
import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { metaReducers, reducers } from './app/reducers';
import { environment } from './environments/environment';
import { HttpClientModule } from '@angular/common/http';

const materialModule = [
  MatSidenavModule,
  MatIconModule,
  MatToolbarModule,
  MatSnackBarModule,
  MatButtonModule,
];

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      ServiceWorkerModule,
      GoogleMapsModule,
      materialModule,
      FontAwesomeModule,
      HttpClientModule,
      provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
      ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
      provideFirestore(() => {
        const db = getFirestore();
        if (environment.useEmulator) {
          connectFirestoreEmulator(db, 'localhost', 8080);
          console.warn('Using firestore emulator');
          connectAuthEmulator(getAuth(), 'http://localhost:9099');
          console.warn('Using auth emulator');
        }
        return db;
      }),
      provideFunctions(() => {
        const functions = getFunctions(undefined, 'europe-west1');
        if (environment.useEmulator) {
          connectFunctionsEmulator(functions, 'localhost', 5001);
          console.warn('Using functions emulator');
        }
        return functions;
      }),
      provideMessaging(() => getMessaging()), StoreModule.forRoot(reducers, {
        metaReducers,
        runtimeChecks: {
          strictStateImmutability: true,
          strictActionImmutability: true,
        },
      }),
      EffectsModule.forRoot([]),
      AppRoutingModule,
      RaceApiModule,
      StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production })),
    {
      provide: LOCALE_ID,
      useValue: 'da',
    },
    DatePipe,
    DateTimePipe,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeFontAwesomeFactory,
      deps: [FaIconLibrary],
      multi: true,
    },
    provideAnimations(),
  ],
}).then(() => {
  if ('serviceWorker' in navigator && environment.production) {
    navigator.serviceWorker.register('ngsw-worker.js');
    navigator.serviceWorker.register('firebase-messaging-sw.js');
  }
  Settings.defaultLocale = 'da';
  registerLocaleData(localeDa);

}).catch(err => console.log(err));

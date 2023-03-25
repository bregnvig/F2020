import { registerLocaleData } from '@angular/common';
import localeDa from '@angular/common/locales/da';
import { APP_INITIALIZER, LOCALE_ID, NgModule } from '@angular/core';
import { provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { PlayerActions, PlayerApiModule, PlayerFacade, RaceApiModule, SeasonApiModule } from '@f2020/api';
import { DriverModule } from '@f2020/driver';
import { initializeFontAwesomeFactory, SharedModule } from '@f2020/shared';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { initializeApp } from "firebase/app";
import 'firebase/auth';
import 'firebase/firestore';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { Settings } from 'luxon';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { metaReducers, reducers } from './reducers';

const materialModule = [
  MatSidenavModule,
  MatIconModule,
  MatToolbarModule,
  MatSnackBarModule,
  MatButtonModule,
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ServiceWorkerModule,
    GoogleMapsModule,
    materialModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    FontAwesomeModule,
    PlayerApiModule,
    DriverModule,
    SeasonApiModule,
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => {
      const db = getFirestore();
      if (environment.useEmulator) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.warn('Using emulator');
      }
      return db;
    }),
    provideFunctions(() => getFunctions(undefined, 'europe-west1')),
    provideMessaging(() => getMessaging()),
    StoreModule.forRoot(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
      },
    }),
    EffectsModule.forRoot([]),
    AppRoutingModule,
    SharedModule,
    RaceApiModule,
    StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production })
  ],
  providers: [
    {
      provide: LOCALE_ID,
      useValue: 'da',
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeFontAwesomeFactory,
      deps: [FaIconLibrary],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(private facade: PlayerFacade) {
    Settings.defaultLocale = 'da';
    registerLocaleData(localeDa);
    this.facade.dispatch(PlayerActions.loadPlayer());
    const messaging = getMessaging();
    getToken(messaging, { vapidKey: environment.firebaseConfig.vapidKey }).then(
      currentToken => !environment.production && console.log(currentToken),
      error => console.error('An error occurred while retrieving token', error.message)
    );
    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
    });
  }
}



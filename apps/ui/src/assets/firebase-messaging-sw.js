// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js';
import { getMessaging } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-sw.js';

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
const firebaseApp = initializeApp({
  apiKey: 'AIzaSyAK9_kQTf7Lm7TdbYqDP_nFo7fwWvuHfLg',
  authDomain: 'f1.bregnvig.dk',
  projectId: 'f1-2024-8ab8e',
  storageBucket: 'f1-2024-8ab8e.appspot.com',
  messagingSenderId: '651727325900',
  appId: '1:651727325900:web:aec3360693b0b39516d069',
  vapidKey: 'BFnBh8HKN7mhvwA-auVC54sAjaHFBR2gJ6GxtwdW5LxeFfOGztsW84VMlqP9Szzpkhq2MBCA1NXh53BLaUNFc4c'
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = getMessaging(firebaseApp);


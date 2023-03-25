import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp(functions.config().firebase);

export * from './app/account';
export * from './app/bid';
export * from './app/game';
export * from './app/mail';
export * from './app/player';
export * from './app/race';
export * from './app/result';
export * from './app/transaction';
export * from './app/wbc';


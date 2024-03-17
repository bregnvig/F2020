import pkg from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { config } from 'firebase-functions/v1';

const { firestore } = pkg;

initializeApp(config().firebase);

export * from './app/account';
export * from './app/bid';
export * from './app/game';
export * from './app/mail';
export * from './app/player';
export * from './app/race';
export * from './app/result';
export * from './app/transaction';
export * from './app/wbc';


import { initializeApp } from 'firebase-admin/app';
import { afterEach } from 'vitest';
import { clearFirestore, projectId } from './emulator';

// main.ts is not imported by the tests, as it exports every function
initializeApp({ projectId });

afterEach(() => clearFirestore());

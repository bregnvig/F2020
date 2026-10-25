import { ChildProcess, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { emulatorHost, projectId } from './emulator';

let emulator: ChildProcess | undefined;

const running = () =>
  fetch(`http://${emulatorHost}/`)
    .then(() => true)
    .catch(() => false);

/**
 * Starts a Firestore emulator for the tests, with its own ports and a demo project (see firebase.test.json), so it runs next to the
 * emulators used for development without touching their data. An emulator that is already running on the port is reused
 */
export async function setup() {
  if (await running()) {
    return;
  }
  const firebase = createRequire(import.meta.url).resolve('firebase-tools/lib/bin/firebase.js');
  emulator = spawn(process.execPath, [firebase, 'emulators:start', '--config', 'firebase.test.json', '--project', projectId, '--only', 'firestore'], {
    cwd: join(import.meta.dirname, '../..'),
    // A process group, so the Java process of the emulator is stopped too
    detached: true,
    stdio: 'ignore',
  });
  const started = Date.now();
  while (!(await running())) {
    if (emulator.exitCode !== null || Date.now() - started > 60_000) {
      throw new Error(`The Firestore emulator did not start on ${emulatorHost}`);
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
}

export async function teardown() {
  if (emulator?.pid) {
    const exited = new Promise(resolve => emulator!.once('exit', resolve));
    process.kill(-emulator.pid, 'SIGINT');
    await exited;
  }
}

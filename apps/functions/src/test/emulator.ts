/** The ports and project of firebase.test.json */
export const emulatorHost = '127.0.0.1:8180';
export const projectId = 'demo-f2020';

/** Deletes every document in the emulator */
export const clearFirestore = () =>
  fetch(`http://${emulatorHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`, { method: 'DELETE' }).then(response => {
    if (!response.ok) {
      throw new Error(`Could not clear Firestore: ${response.status}`);
    }
  });

import { getFirestore } from 'firebase-admin/firestore';
import { ensureArray } from '@f2020/tools';
import { DocumentReference } from 'firebase-admin/firestore';

export const sendMail = async (emailAddress: string | string[], subject: string, body: string): Promise<DocumentReference> => {

  const db = getFirestore();

  return db.collection('mail').add({
    message: {
      subject,
      html: body,
    },
    to: ensureArray(emailAddress),
  });
};

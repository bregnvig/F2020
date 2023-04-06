import { log, error } from 'firebase-functions/logger';
import { config } from 'firebase-functions/v1';
import * as nodemailer from 'nodemailer';
;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: config().oauth.user,
    clientId: config().oauth.client,
    clientSecret: config().oauth.secret,
    refreshToken: config().oauth.refresh,
    // accessToken: config().ci.token
  }
});

export const sendMail = async (emailAddress: string, subject: string, body: string): Promise<string> => {
  const msg = {
    from: 'f1-2020@bregnvig.dk',
    to: emailAddress,
    subject: subject,
    html: body
  };
  if (config().test) {
    return Promise.resolve('In test environment');
  }

  return new Promise<string>(
    (resolve: (msg: any) => void,
      reject: (err: Error) => void) => {
      transporter.sendMail(
        msg, (error, info) => {
          if (error) {
            error(`error: ${error}`);
            reject(error);
          } else {
            log(`Message Sent 
                          ${info.response}`);
            resolve(`Message Sent  
                          ${info.response}`);
          }
        });
    }
  );
};
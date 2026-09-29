/**
 * Template for apps/builder/src/environment/environment.ts (and environment.prod.ts), which are git-ignored.
 * Copy this file into apps/builder/src/environment/ and fill in the values. Never commit the real files.
 */
import { ServiceAccount } from 'firebase-admin/app';

export const environment: {
  production: boolean;
  /** Season to build, e.g. '2026'. Parsed with parseInt in main.ts */
  season: string;
  /**
   * Firebase service account key, as downloaded from
   * Firebase console → Project settings → Service accounts → Generate new private key.
   * The project_id must match the --project the emulator is started with.
   */
  firebase: ServiceAccount & Record<string, string>;
  /** OpenAI credentials used by humanizer.ts */
  openai: {
    apiKey: string;
    organization: string;
    project: string;
  };
} = {
  production: false,
  season: '2026',
  firebase: {
    type: 'service_account',
    project_id: '<firebase-project-id>',
    private_key_id: '<private-key-id>',
    private_key: '-----BEGIN PRIVATE KEY-----\n<key>\n-----END PRIVATE KEY-----\n',
    client_email: '<service-account>@<firebase-project-id>.iam.gserviceaccount.com',
    client_id: '<client-id>',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/<service-account>%40<firebase-project-id>.iam.gserviceaccount.com',
  },
  openai: {
    apiKey: '<openai-api-key>',
    organization: '<openai-org-id>',
    project: '<openai-project-id>',
  },
};

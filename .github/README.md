# Deploy

`workflows/deploy.yml` deploys to production (`f1-2024-8ab8e`) when something is pushed to `develop`. It compares the push with the last
commit that was deployed successfully, and only deploys what has changed since:

| Deploys                     | When                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------- |
| Hosting                     | `ui` is affected, i.e. the app or a library it uses has changed                       |
| Functions                   | `functions` is affected, i.e. the functions or `@f2020/data`, `openf1` or `tools`     |
| Firestore rules and indexes | `apps/firebase/firestore.rules` or `apps/firebase/firestore.indexes.json` has changed |

A change to `package-lock.json` affects every project, so both hosting and the functions are deployed. The lint and the tests of what
has changed run first, and nothing is deployed when they fail. A failed deploy is tried again with the next push, as the last successful
deploy is still the base. Before the first successful deploy, the push is compared with the previous commit. A run started by hand
from the Actions tab works the same way.

## Pull requests

`workflows/test.yml` lints, tests and builds what a pull request to `develop` changes. The builder is linted but not built, as its
environment with the keys is not in git. `rulesets/develop-test.json` stops a pull request
from being merged before the check `test` has passed. Import it under _Settings → Rules → Rulesets → New ruleset → Import a ruleset_ in
GitHub.

Repository admins can bypass it, so you can push to `develop` directly as before, and the deploy runs the lint and the tests itself.

## Caching

Both workflows set up with `.github/actions/setup`. It restores `node_modules` from a cache, and only runs `npm ci` when `package-lock.json` has
changed. Pull requests use the cache the deploy saved on `develop`, so the first pull request after a change of the lock file installs
from scratch. The Firestore emulator for the function tests is cached too.

## Setup

The workflow needs two secrets, under _Settings → Secrets and variables → Actions_ in GitHub.

### `FIREBASE_SERVICE_ACCOUNT`

The JSON key of a service account in the production project:

1. In the Google Cloud console of `f1-2024-8ab8e`, under _IAM & Admin → Service Accounts_, create a service account, e.g. `github-deploy`
2. Give it the roles _Firebase Admin_, _Cloud Functions Admin_, _Service Account User_ and _Cloud Scheduler Admin_. If a deploy fails
   with a missing permission, the log of the step names it
3. Under _Keys_, add a JSON key, and paste the whole file as the secret

### `FUNCTIONS_ENV`

The contents of `apps/functions/environment/.env`, which is not in git: `OPEN_AI_API_KEY`, `OPEN_AI_PROJECT`, `OPEN_AI_ORGANIZATION`,
`OPEN_F1_USERNAME` and `OPEN_F1_PASSWORD`, one `NAME=value` per line.

## Notes

- A function that is removed from the code is not deleted, as the deploy is not interactive. The deploy fails instead, and the function is
  deleted with `firebase functions:delete <name> --project production`
- The deploy scripts in `package.json` still work for deploying by hand

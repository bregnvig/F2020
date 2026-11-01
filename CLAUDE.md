# F2020 Project Context for Claude

## Project Overview

F2020 is a Formula 1 betting application built with Angular and Firebase. The application allows users to place bets on F1 races and tracks live results using OpenF1 API data.

## Tech Stack

- **Frontend**: Angular 22, Angular Material, TailwindCSS, TypeScript 6
- **Backend**: Firebase (Firestore, Functions, Cloud Messaging)
- **Build System**: Nx monorepo
- **APIs**: OpenF1 for live F1 data

## Key Commands

### Development

- `npm run start` or `nx serve ui` - Start UI development server
- `nx serve builder` - Run data builder (populate Firestore)
- `npm run serve:firebase` - Start Firebase functions development

### Testing & Quality

- `npm test` - Run tests. The functions (`nx test functions`) and `@f2020/data` (`nx test data`) have tests, with Vitest

### Function Tests

The tests start their own Firestore emulator on port 8180 with the project `demo-f2020` (`apps/functions/firebase.test.json`), so they
run next to the emulators used for development without touching their data. Java 21 is needed, as for the other emulators.

- Callables are called in the test with `call(fn, data, uid)`, and triggers with `updateAndTrigger()` and `createdTrigger()`, from
  `apps/functions/src/test/functions.ts`. One trigger does not set off another, so test each on its own
- Players, races, bids and results are in `apps/functions/src/test/fixtures.ts`. The comments there have the points each bid gets
- The rules specs in `apps/functions/src/app/rules` test `apps/firebase/firestore.rules`
- OpenAI and OpenF1 are mocked with `vi.mock` where they are used. Firestore is cleared after each test
- `npm run lint` - Run linting
- `npm run format` - Format code

### Builder

Data fixes run with `nx serve builder --args="..."` and are dry runs unless `--write` is passed.

- `--fix-driver-standings` - Rebuild `standings/all-drivers` from OpenF1. Add `--keep-wins` to keep the stored wins and only fetch the last race
- `--fix-fastest-laps` - Count the fastest laps of the races from the OpenF1 laps, and write only them to `standings/all-drivers`.
  `--fix-driver-standings` counts them too, and `--keep-wins` keeps them
- `--fix-team-standings` - Rebuild the championship of the teams in `standings/teams` from OpenF1: points, positions, wins and the place after each race
- `--clean-teams` - Remove the championship fields from the teams, which is in `standings/teams` now. Run it when the app reads
  `standings/teams`
- `--fix-schedule` - Write the schedule (the sessions of the weekend) of the races from the calendar `f<season>.ics`, matched by circuit.
  Only the schedule is written, so it works on races that are closed or completed
- `--fix-driver-results` - Recalculate the driver results, from OpenF1 with `--reload`
- `--build-last-year` - Rebuild `lastYear` and the driver results of last year (`standings/drivers/<last year>`) from OpenF1. Drivers are
  found by the number they had in each session, as numbers change between seasons. The circuit of a race may have to be picked by hand

### Firebase/Emulator

Start the emulators:

```bash
firebase emulators:start --only=functions,firestore,auth,pubsub --config=firebase.json --export-on-exit=./saved-data --import=./saved-data --inspect-functions --project f1-playground-e1f23
```

- `npm run kill-ports` - Kill occupied ports

### Build & Deploy

- `npm run build:ui` - Build UI for production
- `npm run deploy:all` - Deploy hosting, functions, and rules
- `npm run deploy:hosting` - Deploy hosting only
- `npm run deploy:functions` - Deploy functions only

Pushing to `develop` deploys to production with GitHub Actions (`.github/workflows/deploy.yml`, see `.github/README.md`), but only what has
changed: hosting when `ui` is affected, the functions when `functions` is affected, and the Firestore rules and indexes when they change.
So a push is a deploy. Never run the deploy scripts, and don't ask or offer to deploy.

## Project Structure

- `apps/ui/` - Angular frontend application
- `apps/functions/` - Firebase Cloud Functions
- `apps/builder/` - Data import/migration utilities
- `libs/` - Shared libraries and feature modules
  - `libs/api/` - API services and data layer
  - `libs/data/` - Data models and mappers
  - `libs/openf1/` - OpenF1 API types
  - `libs/shared/` - Shared UI components
  - Other feature-specific libraries (race, player, standing, etc.)

## Key Services

- `LiveResultService` - Handles live race data and WebSocket connections
- `OpenF1HttpService` - HTTP client for OpenF1 API
- `OpenF1WSSService` - WebSocket service for real-time F1 data

### OpenF1 Proxy

The app never calls the OpenF1 REST API directly. During a live session OpenF1 answers the CORS preflight of a browser with 401, as
a preflight never has the token. `OpenF1HttpService` calls the callable function `openF1Call` with the path and query
(e.g. `position?session_key=9161`), which fetches it with a server token (`openF1List` in `apps/functions/src/lib/openf1.api.ts`).

- Only players may call it, and the path must be an endpoint with a query, so it can't fetch other URLs
- OpenF1 answers 404 when it has no data. The proxy returns an empty list instead
- The live updates over MQTT are not affected and connect from the browser, with a token from the `getToken` function

### Race Schedule

The builder reads the sessions of each weekend from the calendar into `race.schedule` (`IRaceSession`). Sessions still to be
confirmed (TBC) are left out. Identify a session with `sessionId()` (`practice-1`, `qualifying`, ...) and show it with `sessionName()`.

The result of a session that is over comes from the callable `sessionResultCall`. It fetches the result from OpenF1 the first time and
stores it in `seasons/{season}/races/{round}/sessions/{sessionId}`, so later calls read Firestore. A result is only stored an hour after
the session, as OpenF1 may correct it, and never when it is empty. Delete the document to fetch it again.

While a session is driven, its page shows the times live with `SessionTimingService`, the same way as the live qualifying: the history
from OpenF1 and the updates over MQTT. The race and the qualifying link to their own live pages instead.

## Development Notes

- Uses Nx for monorepo management
- Firebase emulator for local development
- OpenF1 API integration for live race data
- WebSocket connections for real-time updates
- Angular standalone components pattern

## Domain Notes

- **UI text is Danish**, code and comments are English
- **Light and dark theme**: an M3 Material theme in `apps/ui/src/styles.scss`. A player chooses light, dark or system in the profile
  (`player.colorScheme`), which `ColorSchemeService` applies with `color-scheme` and the `dark` class of Tailwind (`darkMode: 'selector'`).
  A script in `index.html` applies it before the app has loaded. Never hard-code white or black for text and backgrounds. Use the colour roles of the theme, which are
  Tailwind colours in `tailwind.config.js` (`text-on-surface`, `bg-primary`, ...), or `var(--mat-sys-...)`. Add a role there when one is
  missing. Logos are shown in a white circle, so black logos show in both
- **Fonts**: Titillium Web (semi-bold) in the titles and Inter in the text, set in the theme in `styles.scss`. Don't set a font on
  a component, as everything inherits them
- **Championship points**: drivers (`IDriverStanding`) and teams (`ITeamStanding`) extend `IChampionshipPoints` with `points`, `position`,
  `previousPoints` and `previousPosition`. They come from the OpenF1 championship endpoints, where `points_start` and `position_start`
  are before the session. On a sprint weekend pass the sprint's championship as `weekendStart`, so the previous standing is from before
  the weekend. Map them with `championshipPoints()` and get places moved with `positionChange()` (positive is up).
  Show places moved with `<sha-position-change>`
- **Team standings**: an admin edits the teams in `seasons/{season}/teams`. Their championship from OpenF1, with wins and the place after
  each race, is in `standings/teams` by constructor id (`ITeamStandings`), read with `TeamService.standings`
- **WBC standings** are not stored. They are summed from `season.wbc.results`

### Images from formula1.com

OpenF1 has no team images, and returns a grey silhouette with status 200 for drivers without a headshot (e.g. new drivers),
so an image error never fires. formula1.com has a media library with fixed paths, which are kept in one place,
`libs/shared/src/lib/formula1-media.ts`. It is not an official API, so always keep a fallback.

- **Always use `<sha-driver-headshot [driver]>` for driver images.** It tries the face cropped from the formula1.com photo of the
  season, then the OpenF1 `headshotUrl`, then a placeholder. It fills its host, so put `matListItemAvatar` or the `avatar` class on it
- **Always use `<sha-team-logo [seasonId] [name]>` for team images.** It falls back to the first letter of the team
- Paths use the team name as OpenF1 has it, in lower case without spaces (`Haas F1 Team` is `haasf1team`), and the driver reference
  (`lannor01`) found in the OpenF1 headshot URL

### Landing Page Cards

Players choose which cards to show in their profile. To add a card:

1. Add its id to `LandingCard` and an entry to `landingCards` in `player.model.ts`, in the order it is shown
2. Wrap it in `@if (shown('<id>'))` in `landing.component.html`
3. Let the card hide itself with `host: { '[hidden]': ... }` when it has nothing to show, and keep "not loaded yet" apart from "empty"

`hiddenLandingCards` stores the hidden cards, so new cards are shown by default. When every card is hidden, all are shown.

### Notifications

`sendNotification(tokens, title, body, { badge, link, data })` in `apps/functions/src/lib/message.service.ts` always sends
`webpush.fcmOptions.link`. Without a link the Firebase service worker ignores a click. Give notifications about a race
`raceLink(season, round)`, and other pages `appLink(...)`. Without `link` the notification opens the home page.

### Library Boundaries

Feature libraries loaded by the router (e.g. `@f2020/standing`) must not be imported statically by other libraries. Put shared
services in `@f2020/api` and shared components in `@f2020/shared`.

## Angular Coding Standards

**Always follow the latest recommendations for Angular and TypeScript/JavaScript.** When the recommendations change, new code follows
the new recommendation, even when older code in the codebase does not. Existing code is changed only when it is being worked on anyway.
Check the current Angular best practices (the `angular-cli` MCP `get_best_practices`) when in doubt.

- **File names**: Angular 22 drops the type suffix, so new components are named e.g. `team-logo.ts`, not `team-logo.component.ts`
- **Template-only members** are `protected`, class-only members `#private`, inputs and outputs public
- **Services** use `@Service()` from `@angular/core`, not `@Injectable({ providedIn: 'root' })`
- **Comments** explain why, or what isn't clear from the code. Simple logic doesn't need one, e.g. not
  `/** The same rule as for the data of the page */` above `relive = computed(() => isRaceRelived(this.race()!))`

### Functional API (Preferred)

**Always use Angular's functional API instead of decorators**:

```typescript
import { booleanAttribute } from '@angular/core';

// ✅ PREFERRED: Functional API
export class MyComponent {
  placeholder = input<string>();
  disabled = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  valueChange = output<string>();
}

// ❌ AVOID: Decorator API
export class MyComponent {
  @Input() placeholder?: string;
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<string>();
}
```

**Benefits of Functional API**:

- Better type inference
- Easier to test and mock
- More consistent with modern Angular patterns
- Better tree-shaking

**IMPORTANT: Boolean Input Requirements**:

- **ALWAYS** use `booleanAttribute` transformer for boolean inputs
- **NEVER** leave constructors empty - always include initialization logic
- **When refactoring**: If you find an empty constructor, remove it entirely
- This ensures proper HTML attribute handling (e.g., `<component disabled>` works correctly)

```typescript
import { booleanAttribute, effect } from '@angular/core';

// ✅ CORRECT: Boolean input with transformer
export class MyComponent {
  disabled = input<boolean, string | boolean>(false, { transform: booleanAttribute });

  constructor() {
    // Required: Never leave constructor empty
    effect(() => {
      // Initialization logic here
    });
  }
}

// ❌ WRONG: Boolean input without transformer
export class MyComponent {
  disabled = input<boolean>(false); // Missing booleanAttribute

  constructor() {
    // Empty constructor - NOT ALLOWED
  }
}

// ✅ CORRECT: When refactoring, remove empty constructor entirely
export class RefactoredComponent {
  disabled = input<boolean, string | boolean>(false, { transform: booleanAttribute });

  // No constructor needed if no initialization logic
}
```

### Input Requirements and User Prompting

**When creating components with inputs, follow these guidelines for required vs optional properties**:

```typescript
// ✅ PREFERRED: Clear distinction between required and optional inputs
export class MyComponent {
  // Required inputs - no default value
  userId = input.required<string>();
  entityId = input.required<number>();

  // Optional inputs - provide sensible defaults
  placeholder = input<string>('Enter value...');
  disabled = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  maxLength = input<number>(100);

  constructor() {
    // Never leave constructor empty - always include initialization logic
    effect(() => {
      console.log('Component initialized with userId:', this.userId());
    });
  }
}
```

**When to ask users for clarification**:

- **ASK** when a required input has no clear default and the context doesn't provide obvious guidance
- **ASK** when the business logic requires specific validation rules or constraints
- **ASK** when there are multiple valid approaches and the choice affects functionality significantly

**When to make reasonable assumptions**:

- **ASSUME** sensible defaults for optional inputs (empty strings, false for booleans, reasonable numbers)
- **ASSUME** standard Angular patterns (e.g., disabled defaults to false, placeholder defaults to helpful text)
- **ASSUME** consistent behavior with existing similar components in the codebase

**Examples**:

```typescript
// When in doubt about validation - ASK USER
export class FormInputComponent {
  value = input.required<string>();
  // Should ask: "What validation rules do you need? (required, email, minLength, etc.)"
  validators = input<ValidatorFn[]>([]);
}

// Standard UI patterns - MAKE ASSUMPTIONS
export class ButtonComponent {
  label = input.required<string>();
  disabled = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  type = input<'button' | 'submit'>('button'); // Sensible default
  variant = input<'primary' | 'secondary'>('primary'); // Reasonable default

  constructor() {
    // Always include constructor logic - never leave empty
    effect(() => {
      if (this.disabled()) {
        console.log('Button is disabled');
      }
    });
  }
}
```

### New Control Flow Syntax (Preferred)

**Always use the new `@if`, `@for`, `@switch` syntax**:

```typescript
// ✅ PREFERRED: New control flow
@Component({
  template: `
    @if (isLoading) {
      <div>Loading...</div>
    } @else {
      <div>Content loaded</div>
    }

    @for (item of items; track item.id) {
      <div>{{ item.name }}</div>
    } @empty {
      <div>No items found</div>
    }

    @switch (status) {
      @case ('pending') {
        <div>Pending...</div>
      }
      @case ('complete') {
        <div>Complete!</div>
      }
      @default {
        <div>Unknown status</div>
      }
    }
  `
})

// ❌ AVOID: Old structural directives
@Component({
  template: `
    <div *ngIf="isLoading; else content">Loading...</div>
    <ng-template #content>Content loaded</ng-template>

    <div *ngFor="let item of items; trackBy: trackByFn">
      {{ item.name }}
    </div>

    <div [ngSwitch]="status">
      <div *ngSwitchCase="'pending'">Pending...</div>
      <div *ngSwitchCase="'complete'">Complete!</div>
      <div *ngSwitchDefault>Unknown status</div>
    </div>
  `
})
```

**Benefits of New Control Flow**:

- Better type checking
- Improved performance
- More readable and maintainable
- Better IDE support

### Private Fields

**Use `#` modifier for true private fields instead of `private` keyword**:

```typescript
// ✅ PREFERRED: True private fields with #
export class MyComponent {
  #service = inject(MyService);
  #internalState = signal('initial');

  constructor() {
    // Can access #service and #internalState here
  }

  publicMethod() {
    return this.#internalState();
  }
}

// ❌ AVOID: TypeScript private keyword
export class MyComponent {
  private service = inject(MyService);
  private internalState = signal('initial');

  constructor() {
    // These are not truly private at runtime
  }
}
```

**Benefits of `#` Private Fields**:

- True privacy at runtime (not just compile-time)
- Cannot be accessed from outside the class, even with type assertions
- Better encapsulation and security
- Follows modern JavaScript standards

### Dependency Injection

**Use `inject()` function instead of constructor injection**:

```typescript
// ✅ PREFERRED: inject() function with private fields at top
export class MyComponent {
  #service = inject(MyService);
  #router = inject(Router);
  #fb = inject(FormBuilder);

  // Other class members after injected dependencies
  form = this.#fb.group({
    name: ['', Validators.required],
  });

  constructor() {
    // Constructor logic if needed
  }

  someMethod() {
    this.#service.getData();
  }
}

// ❌ AVOID: Constructor injection
export class MyComponent {
  constructor(
    private service: MyService,
    private router: Router,
    private fb: FormBuilder,
  ) {}
}
```

**Benefits of `inject()` Function**:

- More concise and readable
- Better tree-shaking
- Easier testing and mocking
- Works well with functional programming patterns
- Can be used outside of constructor

**Ordering Rules**:

- Static fields/functions first (if any)
- Injected dependencies with `#` at the very top of class body
- Other class members after injected dependencies

### Signal-Based Reactive Programming

**Use signals for state management**:

```typescript
// ✅ PREFERRED: Signals
export class MyComponent {
  count = signal(0);
  doubledCount = computed(() => this.count() * 2);

  increment() {
    this.count.update(c => c + 1);
  }
}

// ❌ AVOID: Traditional reactive forms without signals
export class MyComponent {
  count = 0;

  get doubledCount() {
    return this.count * 2;
  }
}
```

### Mad & reduce

Prefer mad/reduce for array transformations:

```typescript
// ✅ PREFERRED: mad/reduce
const doubled = mad(numbers, n => n * 2);
const sum = reduce(numbers, (acc, n) => acc + n, 0);
// ❌ AVOID: forEach
const doubled = numbers.map(n => n * 2);
let sum = 0;
numbers.forEach(n => (sum += n));
```

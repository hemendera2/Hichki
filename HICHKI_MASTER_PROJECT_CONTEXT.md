# Hichki — Master Project Context / Source of Truth

**Date:** 2026-08-11
**Repository:** `hemendera2/Hichki`
**Default branch:** `main`

## 1. Product identity

Hichki is a **local-first 1:1 chat + journal/notes + music app** designed from one codebase for:

- Web/PWA
- Android
- iOS

The product must remain recognizably **Hichki**. The job is to polish, harden and complete the existing product — **not redesign it into a different app**.

The supplied Hichki logo is the visual identity reference: a warm golden speech-bubble/notebook form, dark musical note, light-blue infinity-like stroke and gold star accent. Do not replace it with a generic chat icon or a different brand direction.

## 2. Non-negotiable product rule

> **Preserve the existing Hichki core UI, information architecture, interaction model, content model and visual identity. Improve the details around them. Do not turn Hichki into a WhatsApp/Telegram/Instagram clone or into a completely new concept.**

Any proposed UI change must answer:

1. Does this still look and feel like the existing Hichki app?
2. Does it make the existing flow clearer, faster or more comfortable?
3. Does it preserve the product's original idea and familiar interaction patterns?
4. Is the change genuinely useful rather than decorative AI-generated redesign?

If the answer is no, do not implement it.

## 3. Existing core that must stay

Hichki's core areas are:

- 1:1 chat
- Real-time person-to-person messaging
- Online/presence state
- Notes/journal-style communication identity
- Music section
- Settings
- Local-first behavior
- Web + native Android/iOS shell

The existing visual language is distinctive and must remain the foundation. The objective is **premium refinement, not replacement**.

## 4. Messaging / realtime requirement

The app must support a genuine live 1:1 chat experience:

- User A sends a message to User B.
- User B receives it in real time without refresh.
- Presence/online state updates correctly.
- Messages persist correctly.
- Offline/local-first behavior remains resilient.
- Reconnects must not silently duplicate or lose messages.
- UI must distinguish sending/sent/failed states appropriately if the current architecture supports them.

Do not fake realtime with local demo arrays or refresh-based polling if a real realtime implementation is already present.

## 5. Native/platform requirements

The same product must work well on Android and iOS through the existing Capacitor/native approach.

Required platform behavior:

- Safe-area aware layout.
- Correct notch/Dynamic Island/home-indicator handling.
- No important controls trapped against screen edges.
- Android native back handling.
- iOS-friendly navigation behavior.
- Touch targets large enough for mobile use.
- Keyboard-aware composer.
- No accidental horizontal overflow.
- Web and native should feel like the same Hichki product.

### Gestures

The intended gesture layer includes:

- **Left-edge swipe → Back** where the current screen permits navigation back.
- **Upward swipe → Focus/open composer/keyboard** when contextually appropriate.
- **Downward swipe → Dismiss keyboard** where appropriate.

Gestures must be smooth, predictable and non-conflicting with scrolling, text selection and horizontal controls. Do not add gestures merely for novelty.

## 6. UX corrections explicitly requested

These are confirmed product requirements, not optional suggestions.

### 6.1 Outside-click dismissal

Any contextual popover/action menu/modal-like surface that currently requires the X button must also close when the user taps/clicks the safe outside/backdrop area, unless the surface intentionally requires modal confirmation.

Apply this consistently across the app:

- message action menu
- share/media sheet
- chat details
- theme selector
- settings dialogs
- other transient overlays

Do not make unrelated surfaces close accidentally because of a global click handler. Use proper event boundaries and accessibility behavior.

### 6.2 Animation quality

Current weak point: some popups, media/share surfaces, keyboard/download-like transitions and closing behavior feel cheap or abrupt.

Required direction:

- short, intentional transitions
- subtle opacity + scale/translate where appropriate
- coherent easing
- no excessive bounce
- no sluggish animation
- no animation that delays a simple action
- opening and closing should feel like one designed system
- respect `prefers-reduced-motion`

Animations should communicate hierarchy and state, not show off.

### 6.3 Chat screen refinement

The chat screen should remain **clean and simple**, but spacing and hierarchy must be tightened.

Improve:

- vertical rhythm
- message grouping
- header density
- composer proportions
- whitespace
- timestamp placement
- avatar/name relationship
- safe-area spacing
- keyboard interaction
- visual balance between conversation and composer

Do not replace the existing Hichki chat concept with a generic WhatsApp-like screen.

### 6.4 Home chat list

Home/chat list rows should be simplified.

The row should primarily communicate:

- person/avatar/logo
- name
- online status when applicable
- time
- last message preview where the existing Hichki design already uses it appropriately

Remove redundant repeated naming and unnecessary small text that makes the row visually noisy.

The final result should be compact, scannable and beautifully balanced rather than empty or over-designed.

### 6.5 "Add new chat" area

The small "4 left" indicator below Add New Chat is not important to the product experience. Remove it unless there is a clearly validated functional reason to keep it.

### 6.6 Settings

Settings currently feels boring. Improve it without changing the product's underlying logic.

Goals:

- better hierarchy
- clearer grouping
- more intentional spacing
- useful micro-interactions
- consistent typography
- premium but restrained presentation

Do not turn Settings into a completely different design system.

### 6.7 Music section

The music section keeps its existing core concept.

Fix the current visual collision where the share control and the vinyl/record-related line/graphic overlap or clash.

Improve spacing, hierarchy and visual polish around the existing music experience without replacing its concept.

## 7. Typography

Choose a small, coherent font system specifically for Hichki.

Do **not** add dozens of fonts.

Use a limited premium pairing/stack that:

- reads extremely well on Android and iOS
- works at small mobile sizes
- complements Hichki's warm, artistic, conversational identity
- has strong numerals and punctuation
- remains performant
- has reliable fallbacks

Use the selected type system consistently throughout the app.

## 8. Themes

Users should be able to change the app's color theme.

The theme system must preserve Hichki's identity and component hierarchy. It must not become a collection of random gradients.

Create **four** carefully curated theme presets. They should be materially different color combinations but all look like intentional Hichki themes.

Theme requirements:

- readable foreground/background contrast
- accessible controls
- consistent surfaces/borders/dividers
- chat bubbles remain readable
- composer remains clear
- selected/active states remain obvious
- status colors remain semantically understandable
- themes work across chat, home, settings and music
- theme selection persists

Do not change layout or product logic when changing a theme.

## 9. Visual design philosophy

Hichki must feel:

- original
- intimate
- calm
- expressive
- premium
- simple
- habitual/easy to learn
- unmistakably its own product

Avoid:

- generic AI dashboard aesthetics
- excessive glassmorphism
- random gradients
- oversized cards
- excessive shadows
- excessive pills
- excessive decorative icons
- copied WhatsApp/Telegram/Signal layouts
- copied Apple/Google visual identity
- unnecessary animations
- novelty for novelty's sake

The logo, existing layout language and existing interaction model are the anchors.

## 10. Mobile ergonomics

Every screen must be checked for:

- edge controls
- safe-area insets
- keyboard overlap
- bottom navigation/home indicator
- top status/notch area
- scroll containment
- modal/sheet reachability
- touch target size
- one-handed use
- accidental taps
- back navigation

A UI that looks good in a screenshot but frustrates users in actual touch use is not acceptable.

## 11. Accessibility and resilience

Keep the product visually distinctive while improving fundamentals:

- semantic buttons/labels where applicable
- keyboard/focus behavior on web
- visible focus where relevant
- sufficient contrast
- reduced-motion support
- touch-friendly targets
- no information conveyed by color alone
- graceful empty/loading/error states

## 12. Engineering rules

Before changing code:

1. Inspect the current GitHub repository.
2. Read existing README, project docs, build workflows and relevant source.
3. Identify the current architecture before proposing a replacement.
4. Reproduce/locate the actual failure before fixing it.
5. Prefer the smallest safe change that permanently solves the root cause.
6. Do not create duplicate implementations.
7. Do not leave dead/competing UI systems behind.
8. Do not silently change product logic.
9. Do not invent successful builds or tests.
10. Verify every claimed fix from the repository/build evidence available.

## 13. Known CI history / build lesson

Previous GitHub Actions failures repeatedly occurred in native Android/iOS workflows.

One confirmed failure was:

`Could not find installation of TypeScript. To use capacitor.config.ts files, you must install TypeScript in your project.`

The current `package.json` on `main` already declares TypeScript `^5.9.2` as a dev dependency. fileciteturn148file0L1-L6

Another confirmed CI problem was that the runner reported no supported dependency lock file (`package-lock.json`, `npm-shrinkwrap.json`, or `yarn.lock`). Therefore CI must be made deterministic and must not depend on a missing lock file.

Do not repeatedly rerun a failing workflow without inspecting the exact failing step and root cause.

## 14. Build requirements

The final project should provide reliable paths for:

- web build
- Android debug APK build
- iOS project/simulator build path
- Capacitor sync
- production verification

The current package scripts include web build plus Capacitor Android/iOS commands. fileciteturn148file0L2-L6

CI should:

- install dependencies deterministically
- use a supported Node version
- use Java 21 for the Android build if required by the current Capacitor/Gradle stack
- configure Android SDK consistently
- avoid interactive commands
- produce an APK artifact when the Android build succeeds
- fail with useful diagnostics

## 15. Free/zero-cost constraint

The project should remain viable with free/open-source tooling and free tiers where possible.

Do not introduce paid services, paid APIs or paid infrastructure without explicit approval.

Do not spend money or activate billing.

## 16. Visual review protocol

Before major visual implementation, create visual mockups/screenshots representing the **actual existing Hichki design direction**.

Required visual review areas:

1. Home/chat list
2. Chat screen
3. Message action popover
4. Share/media surface
5. Chat details
6. Settings
7. Theme selector + all four themes
8. Music section
9. Native safe-area/gesture state where visually meaningful
10. App icon/branding placement

Important: the visual mockups must be refinements of the supplied Hichki UI, not a new product proposal.

## 17. Logo / icon

Use the supplied Hichki logo asset as the branding reference.

The logo must be:

- correctly fitted/cropped
- sharp at required sizes
- suitable for adaptive Android icon treatment
- suitable for iOS app icon treatment
- suitable for web/PWA icons
- not stretched
- not arbitrarily recolored
- not replaced by a generic icon

The repository currently contains icon-related files from the existing project; inspect them before replacing anything. Do not blindly create duplicates.

## 18. Product quality bar

The target is not "it technically runs".

Target:

> **A real, usable, polished Hichki app that a normal user can learn quickly and use daily without irritation.**

Every implementation should optimize for:

**correctness → usability → consistency → performance → visual polish**.

## 19. Definition of done

A task is not done merely because code was committed.

For each batch:

- implementation complete
- duplicate/obsolete implementation removed if necessary
- relevant tests/checks added or updated
- build path checked
- no known regression introduced
- UX behavior checked on mobile dimensions
- documentation/state updated
- exact commit/CI result recorded

If blocked:

1. record the exact blocker
2. do not pretend it is solved
3. continue with other safe work that does not depend on it

## 20. Do not repeat these mistakes

- Do not ask the user to repeatedly send screenshots for failures that can be inspected from GitHub.
- Do not repeatedly rerun the same broken workflow without changing the root cause.
- Do not claim "final" when CI is red.
- Do not redesign the whole app because a few components need polish.
- Do not replace the Hichki identity with a generic messenger UI.
- Do not copy another app's theme/layout.
- Do not introduce unnecessary features while known UX/build defects remain.
- Do not create duplicate files/components that can later conflict.
- Do not weaken validation just to make CI green.

## 21. Current repository orientation

The current README describes Hichki as a local-first 1:1 chat, journal and music app with Supabase Realtime messaging, presence, offline-first queueing, Capacitor Android/iOS shells, safe-area handling, gestures, Android back handling, PWA support and push registration hooks. fileciteturn150file0L1-L2

The current `package.json` is version `2.5.0` and includes Capacitor 8.x, Vite 7.x and TypeScript 5.9.x. fileciteturn148file0L1-L6

Treat the actual repository state as authoritative over this document whenever code and documentation disagree. Update this document when an approved product decision changes.

# NEW CHAT MASTER PROMPT — HICHKI

You are continuing the **Hichki** project from GitHub. Do not treat this as a new app. The repository is the canonical project state.

## Repository

`https://github.com/hemendera2/Hichki`

Read the repository first. The canonical project context is:

`HICHKI_MASTER_PROJECT_CONTEXT.md`

Also inspect the current README, package.json, source tree, workflows, existing design/assets and recent commits before making decisions.

## Mission

Finish Hichki as a **real, polished, usable cross-platform app** for Web/PWA + Android + iOS from the existing codebase.

The most important rule:

> **Do NOT redesign Hichki into a different app. Preserve the existing Hichki core, identity, UI language, information architecture and product idea. Fix the small weaknesses, polish the interactions, harden the implementation and make it feel premium.**

The user explicitly rejected a previous visual proposal because it looked like a totally new app. That must never happen again.

## Existing product core — preserve it

Hichki is a local-first:

- 1:1 chat app
- real-time messaging app
- journal/notes-style communication experience
- music section
- settings/theme system
- web + native Android/iOS app

The Hichki logo is the supplied golden speech-bubble/notebook + dark musical note + light-blue infinity-like stroke + gold star identity. Use the supplied logo correctly; do not replace it with a generic messenger logo.

## Required real functionality

The app must support genuine live 1:1 messaging:

- User A → User B message appears live without refresh.
- User B → User A works the same way.
- Presence/online status works.
- Messages persist.
- Reconnection does not duplicate or silently lose messages.
- Offline/local-first behavior remains robust.
- Do not fake realtime with static/demo arrays if the existing realtime architecture is available.

## UX fixes to implement

### 1. Outside-click dismissal

All transient popovers/sheets/menus that currently only close via X should also close when the user taps/clicks the safe outside area, unless the UI intentionally requires a modal confirmation.

Apply consistently to message actions, share/media surfaces, chat details, theme selector, settings dialogs and similar transient UI.

Use correct event boundaries so a global handler does not cause accidental closures.

### 2. Premium interaction/animation system

Current weak point: popups, media/share boxes, keyboard/download-like transitions and close animations can feel cheap or abrupt.

Create one coherent motion language:

- fast but not rushed
- subtle opacity/scale/translate
- good easing
- no excessive bounce
- no sluggish transitions
- opening and closing feel related
- no animation delaying simple actions
- respect reduced-motion preferences

The goal is **smooth, classy, restrained**, not flashy.

### 3. Chat screen

Keep the current Hichki chat idea and visual identity.

Refine only what is weak:

- spacing
- vertical rhythm
- header density
- message grouping
- timestamps
- avatar/name relationship
- composer size
- keyboard behavior
- safe-area spacing
- visual balance

Do not turn it into a WhatsApp/Telegram/Signal clone.

### 4. Swipe/gesture navigation

Properly verify and polish:

- left-edge swipe → back
- upward swipe → focus/open composer/keyboard where appropriate
- downward swipe → dismiss keyboard where appropriate
- Android native back handling

Gestures must not fight normal scrolling, text selection or horizontal controls.

### 5. Home chat list

Keep it compact and familiar.

Show only useful information such as:

- avatar/logo
- name
- online status when applicable
- time
- appropriate last-message preview

Remove redundant repeated naming/small text and make the rows blend beautifully into the existing Hichki design.

### 6. Add New Chat

Remove the small `4 left` text under Add New Chat unless inspection proves it is functionally required.

### 7. Settings

Settings should no longer feel boring, but the core logic and existing concept must remain.

Improve hierarchy, grouping, spacing, typography and micro-interactions without replacing the whole design.

### 8. Music

Keep the existing music concept.

Fix the share control / vinyl-record line collision and refine spacing/hierarchy around it.

Do not replace the music section with a different product.

### 9. Typography

Select a **small premium font system** specifically suited to Hichki. Do not add dozens of fonts.

It should work well on Android/iOS, be readable at small sizes, match Hichki's warm/artistic/conversational identity and have strong fallbacks.

Use it consistently across the app.

### 10. Themes

Add exactly **four** carefully curated user-selectable Hichki themes.

They should be distinct, premium colour combinations while preserving the same layout and Hichki identity.

All themes must have good contrast, readable chat bubbles, clear controls, correct status semantics and persistence.

Do not turn the theme system into random gradients.

## Design rule

Every visual change must be a **refinement of the existing Hichki app**.

Avoid:

- generic AI dashboards
- copied WhatsApp/Telegram layouts
- copied Apple/Google visual identity
- excessive glassmorphism
- excessive pills/cards/shadows
- random gradients
- oversized decorative UI
- unnecessary animations
- feature creep

Hichki must remain original and recognizable.

## Mobile/native requirements

Verify all screens for:

- Android/iOS safe areas
- notch/Dynamic Island
- home indicator
- keyboard overlap
- bottom controls
- edge buttons
- touch targets
- scroll containment
- modal/sheet reachability
- horizontal overflow
- back navigation

Web and native should feel like the same product.

## Build/CI rule

Do not repeatedly rerun a red GitHub Action without inspecting the actual failing command.

A previous confirmed Android failure was:

`Could not find installation of TypeScript.`

The current package.json already declares TypeScript `^5.9.2`, so inspect the actual current checkout and workflow before changing anything. Another confirmed failure was a missing dependency lock file. Make dependency installation deterministic and remove the root cause rather than repeatedly rerunning the same job.

When a workflow fails:

1. inspect the exact log
2. identify the root cause
3. fix it in the repo
4. run the relevant checks
5. only then rerun CI
6. verify the new result

Never claim a green/final build without evidence.

## Free-only constraint

Use free/open-source/free-tier tooling. Do not spend money, enable billing or introduce paid infrastructure without explicit approval.

## Working method

Do the maximum safe amount of work in one pass.

Prioritize:

1. existing broken functionality/build blockers
2. realtime messaging correctness
3. navigation/gesture/safe-area reliability
4. overlay dismissal and interaction bugs
5. animation/motion polish
6. chat/home/settings/music UX refinement
7. typography
8. four themes
9. native/PWA verification
10. documentation and project-state updates

Do not ask the user to repeatedly explain the same project context. Read `HICHKI_MASTER_PROJECT_CONTEXT.md` first.

Do not ask for screenshots when GitHub/source/logs are sufficient to inspect the problem.

## Visual review requirement

Before implementing major visual changes, generate visual mockups that are **based on the actual existing Hichki UI**, not a replacement concept.

Show/refine these areas:

1. Home/chat list
2. Chat screen
3. Message action menu
4. Share/media surface
5. Chat details
6. Settings
7. Theme selector + four themes
8. Music
9. Native safe-area/gesture states where useful
10. App icon/branding

Only after the visual direction matches the existing Hichki product should major visual changes be implemented.

## Definition of done

A task is done only when:

- root cause fixed
- no duplicate competing implementation left behind
- relevant checks/tests updated
- build path verified
- UX regression risk checked
- native/web behavior considered
- project docs/state updated
- exact CI result known

If blocked, record the exact blocker and continue safe independent work. Never hide the blocker.

## Final operating principle

**Think like the lead engineer + product designer responsible for shipping Hichki, not like a generic UI generator.**

Preserve what already works. Fix what is irritating. Polish what feels cheap. Harden what is fragile. Add only what clearly belongs. Keep Hichki unmistakably Hichki.

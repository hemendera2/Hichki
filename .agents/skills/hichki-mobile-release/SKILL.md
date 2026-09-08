---
name: hichki-mobile-release
description: Use when changing Hichki Web/PWA, Capacitor Android/iOS, share target, native bridge, service worker, keyboard/safe areas, gestures, build workflows, Netlify deployment or release readiness.
---

# Hichki Mobile/PWA Release Skill

## Release principle

Web/PWA, Android and iOS are one Hichki product. A change is incomplete if one target silently breaks another.

Never label source work as production release certification without exact build/runtime evidence.

## Mandatory review matrix

For user-facing changes verify, as applicable:

- Android safe areas/notches;
- iOS safe areas/Dynamic Island/home indicator;
- keyboard open/close and composer visibility;
- Android back navigation;
- edge-swipe/back gestures without fighting scroll/text selection;
- touch target size and reachability;
- horizontal overflow and scroll containment;
- offline/reconnect behavior;
- PWA install/startup/service-worker update path;
- incoming Web Share/PWA share target;
- Capacitor/native incoming share bridge;
- outgoing native/Web Share behavior;
- blob/file URI lifecycle;
- theme persistence and reduced-motion behavior.

## Build discipline

When CI/build fails:

1. inspect the exact failing job/step/log;
2. identify root cause;
3. fix source/config/dependency determinism;
4. run the smallest relevant local/source verification;
5. rerun only after root cause is addressed;
6. record exact result.

Do not repeatedly rerun a red workflow without new evidence.
Do not weaken CI checks simply to turn them green.

## Deployment discipline

Before describing Netlify as updated:

1. prove which exact source/commit produced the build;
2. prove the production build completed successfully;
3. verify required runtime assets exist in the build output;
4. verify configured Socket endpoint/environment values correspond to an actually available endpoint;
5. obtain a concrete deployment ID/source relationship;
6. perform relevant browser acceptance.

An older manual Netlify deployment is `HISTORICAL`, not current source evidence.

## Native acceptance

Android/iOS release claims require actual platform build/acceptance evidence where the environment permits it. If SDK/device/runtime is unavailable, label the gate `NOT-RUN` or `BLOCKED`; do not infer success from web build success.

## Final release gate

Before release/merge claim, reconcile:

- source/build checks;
- Supabase migrations/RLS/grants;
- authenticated two-user messaging;
- Socket.IO relay and fallback;
- deduplication/offline retry;
- receipts/typing/presence;
- Notes/Music sharing;
- exact-source production web build;
- deployment/source match;
- Android/iOS acceptance;
- current project/security status.

Do not merge/deploy unless current project rules and owner authorization allow it.
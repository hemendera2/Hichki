# Hichki UX Final Polish Specification

## Product principle
Preserve Hichki's core idea and information architecture. Improve friction, hierarchy, motion, touch ergonomics, and perceived quality without turning it into a generic social/chat app.

## Required UX pass
- Outside-tap dismissal for transient surfaces: message actions, share, reactions, media share, chat details, QR, menus, sheets and dialogs.
- Escape/back dismissal for transient surfaces before screen navigation.
- Android hardware back and iOS edge-back should dismiss the top transient surface first, then navigate.
- Left-edge swipe-back must be smooth and must not hijack buttons, inputs, horizontal carousels or media controls.
- Up-swipe should focus the composer only when appropriate; never steal an intentional vertical scroll.
- Keyboard appearance must preserve composer visibility and safe-area spacing.
- No accidental double-submit/double-tap on important actions.
- Touch targets must remain comfortable around notches and screen edges.
- Motion should use short, spring-like transitions for sheets, menus, reactions and feedback; avoid abrupt pop-in/pop-out.
- Respect `prefers-reduced-motion`.
- Loading, empty, offline, reconnecting and error states must be calm and informative rather than flashing.
- Presence indicators must mean actual current presence, not merely that a sync code exists.
- Home chat rows: avatar/logo + person name + actual online indicator + time. Do not repeat last-message preview or duplicate the person's name where the requested compact layout does not need it.
- Chat header remains simple and centered.
- Music share action and vinyl/player decoration must have independent layout zones and never overlap.
- Settings remains lightweight and personal; theme selection is additive, not a replacement for the existing settings model.
- Four themes: Obsidian Gold, Midnight Lilac, Forest Mint, Rose Ember.
- Typography: one primary modern sans stack consistently across the product; avoid font proliferation.
- App icon must use the supplied Hichki artwork with proper Android maskable and iOS assets, preserving the artwork's proportions and avoiding squeeze/crop distortion.
- Audio, media, camera, notification and permission flows must fail gracefully and explain the next action.
- App lifecycle: resume/reconnect presence and realtime subscriptions after background/foreground transitions.
- Offline messages remain local and retry safely without duplicate sends.

## Final review surfaces
1. Home / Circle
2. Chat / message actions / reply / reactions / attachments
3. Journal
4. Music / player / share
5. Settings / themes / data backup
6. QR share/import
7. Onboarding
8. Keyboard/composer
9. Android back + gestures
10. iOS safe area + edge gestures
11. Offline/reconnect/presence
12. Native icon/launch presentation

## Definition of done
No known interaction requires a user to hunt for a close button when an outside tap/back action is expected. No transient surface feels abrupt or visually cheap. No edge control is inaccessible because of safe-area placement. No presence indicator claims a person is live without verified current presence. Android CI and iOS CI must pass before release artifacts are called final.

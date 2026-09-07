---
title: scene
description: The DSX-native scene root renders in the browser through the in-kernel WebGL surface installed by registerSceneSurface, over the same corpus-pinned scene fold (transform composition, projection, picking) the two native lanes and the Compose desktop rasterizer read, so a scene cannot mean one thing here and another on a phone.
order: 3
section: components
element: scene
category: scene
scope: library
platforms: web,ios,android
properties: [{"name":"background","type":"color","default":"#000000"},{"name":"mode","type":"enum","default":"3d","values":["3d","2d","ar"]},{"name":"on:ready","type":"action","default":null}]
actions: ["ready"]
catalog: 0.1.0
commit: a0939217acc2dea008185a0feb4874bd2765c7a0
generator: ClosedSource/scripts/generate_component_docs.rb
---

# scene

The DSX-native scene root renders in the browser through the in-kernel WebGL surface installed by registerSceneSurface, over the same corpus-pinned scene fold (transform composition, projection, picking) the two native lanes and the Compose desktop rasterizer read, so a scene cannot mean one thing here and another on a phone.

<RefMeta platforms="Web,iOS,Android">
Category: Scene - Live specimens: the [System gallery](/system).
</RefMeta>

## Usage

```dsx
<scene background="#0b1020"><camera position="0 1.5 4" look-at="0 0 0"/><light kind="ambient" intensity="0.4"/><box color="#2563eb"/></scene>
```

`scene` takes no children.

## Catalog specimen

The catalog has no specimen for `scene` at the default rung yet, so there is nothing to copy here. It appears with no change to this page the moment the catalog carries one: the page is a projection of the catalog, not a screenshot of it.

## States

| Renderer | Audited | Dated | Evidence |
|---|---|---|---|
| web | n/a | 2026-09-07 | P23B audit 2026-09-07: NOT APPLICABLE, the canvas precedent. The scene grammar declares background, mode and on:ready only (OpenSource/Documentation/reference/stack-elements.json), so there is no hover, pressed, focus visible, disabled, loading, error or empty state to depict: measured live in the locked Playwright Chromium (evidence/p23b-logs/p23b-probe.json, harness evidence/p23b-logs/p23b-catalog-proof-probe.ts) the mounted host is role img with 0 focusable descendants at 390x844 touch and 1366x1024 fine pointer. The one state it does have, rest, is scheme correct and measured: fill rgba(17, 17, 24, 0.06) light and rgba(255, 255, 255, 0.09) dark. |
| ios | n/a | 2026-09-07 | P23B audit 2026-09-07: NOT APPLICABLE for the same reason as the web column, the canvas precedent: the grammar declares background, mode and on:ready only, so there is no state ladder to depict. The iOS host is an SCNView bound at OpenSource/Engine/iOS/SceneElement.swift:565-572, and that file type checks inside the shipping app target: xcodebuild build -workspace ClosedSource/Runtime.xcworkspace -scheme Runtime -destination generic/platform=iOS Simulator reports BUILD SUCCEEDED with 0 errors (evidence/p23b-logs/ios-runtime-build.log). |
| android | n/a | 2026-09-07 | P23B audit 2026-09-07: NOT APPLICABLE for the same reason as the other two columns, the canvas precedent: background, mode and on:ready are the whole grammar, so there is no state ladder. The Android home is ComposeStackComponents.defineNative("scene") at OpenSource/Engine/Android/render/src/main/kotlin/despia/engine/render/elements/SceneElements.kt:154-156, and check_element_unification.rb rule 3 passes with 0 failures. |

Rest, hover on a fine pointer, pressed, focus visible and disabled, in both colour schemes, plus loading, error and empty where the component has them.

## Attributes

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `background` | `color` | `#000000` | `#rgb`/`#rrggbb`; reactive. |
| `mode` | `3d` \| `2d` \| `ar` | `3d` | `3d` / `2d` / `ar`. `2d` is the SAME graph under an orthographic camera (z = layer order); `ar` is scheduled (P3). |
| `on:ready` | `action` |  | Fires after the first rendered frame. |

Every element also carries the [universal attributes](/components/attributes): accessibility, animation, `class`, `style` and the platform suffixes.

## Events

| Event | Handler |
|---|---|
| `ready` | `on:ready="..."` |

A payload arrives FLAT in the handler scope, so a declared action names the key bare (`message="message"`), never through an `event` plane.

## Platform notes

| Renderer | Grammar | What that means |
|---|---|---|
| web | `supported` | the built in renderer implements this element |
| ios | `reference` | the reference renderer this element is specified against |
| android | `enforced` | implemented and pinned by the element parity test |

The DSX-native scene root renders in the browser through the in-kernel WebGL surface installed by registerSceneSurface, over the same corpus-pinned scene fold (transform composition, projection, picking) the two native lanes and the Compose desktop rasterizer read, so a scene cannot mean one thing here and another on a phone.

**Known limits on the web**

- The server renderer emits the sized, labelled box only: the canvas is client-only, and a generic child walk would paint unsupported markers for the scene-space tags, which are not DOM children.
- The surface is installed by the boot path, so a sliced embed that never imports it falls to the labelled placeholder rather than to a silent blank.
- A build with no WebGL context renders the honest labelled fallback inside the scene box, and the scheduled words of the ladder render their named placeholder rather than nothing.

**Implementation notes.** The DSX-native scene root. Every NUMBER is the corpus-pinned kernel fold (OpenSource/Conformance/scene/), shared by all four renderers, which is why this fixture pins the root attribute contract and no per-renderer chrome: the scene vocabulary inside the box (camera, light, group, box, sphere, plane, model, text3d, anchor) is scene space, not stack children, and its defaults live in the corpus rather than in a builder. Web SSR emits the sized labelled box only, because the canvas is client-only and a generic child walk would paint unsupported markers for the scene-space tags.

Declared platforms: `ios`, `android`.

**Adaptivity (web, 2026-09-07).** P23B audit 2026-09-07: one DECLARED fluid presentation at every form factor, measured live in the locked Playwright Chromium (evidence/p23b-logs/p23b-probe.json, harness evidence/p23b-logs/p23b-catalog-proof-probe.ts): the host measured 390x219.38 at 390x844 with touch emulation and 1366x768.38 at 1366x1024 with a fine pointer, both exactly the declared aspect-ratio 16 / 9 (SCENE_CSS, scene.ts:2127), with 0 page errors. RTL safe: the surface is full bleed and the RTL plane leaves it at x 0 width 390. It touches no edge of its own, so the safe area is the scaffold's plane.

## Theming

DSX has one styling vocabulary and it is CSS. Three doors reach this element, and they differ only in how often the look repeats: `style="..."` for a declaration list on one element, `class="..."` for a name declared in a `<style>` block, and the component's own sheet for everything a whole screen shares.

On the web this element's root carries `dsx-scene`, the stable class the contract application CSS targets. It is a rendering fact you can read, not a styling hook to depend on: style the element, not the class the renderer stamps.

Web runtime: `media`.

## Accessibility

| Renderer | Audited | Dated | Evidence |
|---|---|---|---|
| web | yes | 2026-09-07 | P23B audit 2026-09-07: measured live in the locked Playwright Chromium (evidence/p23b-logs/p23b-probe.json, harness evidence/p23b-logs/p23b-catalog-proof-probe.ts) the host is role img with aria-label bound from the a11yLabel attribute and defaulting to "3D scene" (scene.ts:601-602), measured role img and aria-label "3D scene" on all six planes; the WebGL canvas is aria-hidden true (scene.ts:1402) so the tree carries one node, not a duplicate; the fallback and scheduled notices are role note (scene.ts:1394, 1410); and forced colors gets an explicit CanvasText border with forced-color-adjust auto (SCENE_CSS). There is no keyboard operation to prove because the surface is not interactive, which is the same reading canvas, svg and qrcode carry. |
| ios | no, and named | 2026-09-07 | P23B audit 2026-09-07: AUDITED RED. OpenSource/Engine/iOS/SceneElement.swift:571-572 sets view.isAccessibilityElement = true and view.accessibilityTraits = .image, the twin of the web role img, but it never sets an accessibilityLabel, so the a11yLabel the web column binds (scene.ts:602, defaulting to "3D scene") is not spoken on iOS and the element announces as an unnamed image. The whole file carries exactly two accessibility lines (grep -n accessibility OpenSource/Engine/iOS/SceneElement.swift). Bounded fix, but it is a renderer edit with a parity row rather than a matrix edit, so it is named here. |
| android | no, and named | 2026-09-07 | P23B audit 2026-09-07: AUDITED RED, and worse than the iOS column. OpenSource/Engine/Android/render/src/main/kotlin/despia/engine/render/elements/SceneElements.kt carries NO semantics at all: no contentDescription, no Role.Image, no dsxAccessibleActivation, nothing (grep -in 'semantics\|contentDescription\|a11yLabel\|dsxAccessible' over the file returns zero lines). The web column speaks role img plus an aria-label and iOS speaks an unnamed image trait; Android speaks nothing, so the surface is invisible to TalkBack. Bounded fix, but it is a renderer edit with a parity row rather than a matrix edit, so it is named here. |

Every element carries `a11yLabel`, `a11yHint`, `a11yValue`, `a11yTrait`, `a11yGroup` and `a11yHidden`. A control that draws an icon beside text is one group with one label, never two announcements; see the [universal attributes](/components/attributes).

This page is GENERATED by ClosedSource/scripts/generate_component_docs.rb. A hand edit here is overwritten on the next run by design: fix the ledger instead (the attribute and event contract in `OpenSource/Documentation/reference/stack-elements.json`, the platform support and the audit in `OpenSource/Conformance/library/matrix.json`, the description and the web limits in `OpenSource/Web/support/element-support.json`, the specimen in `OpenSource/Catalog`).


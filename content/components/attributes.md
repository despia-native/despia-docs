---
title: Universal attributes
description: The vocabulary every element carries, whatever it draws: accessibility, animation, class, style and the platform suffixes.
order: 3
section: components
element: 
category: 
scope: reference
platforms: web,ios,android,desktop
properties: [{"name":"a11yGroup","type":"bool","default":null},{"name":"a11yHidden","type":"bool","default":null},{"name":"a11yHint","type":"string","default":null},{"name":"a11yLabel","type":"string","default":null},{"name":"a11yPressed","type":"expr","default":null},{"name":"a11yTrait","type":"csv","default":null,"values":["button","header","image","link","selected","static"]},{"name":"a11yValue","type":"string","default":null},{"name":"anim","type":"enum","default":"easeInOut","values":["spring","easeInOut","easeIn","easeOut","linear"]},{"name":"animDuration","type":"number","default":null},{"name":"chrome","type":"bool","default":"false"},{"name":"class","type":"string","default":null},{"name":"container","type":"bool","default":null},{"name":"dismissEdge","type":"string","default":null},{"name":"dynamicType","type":"bool","default":"false"},{"name":"dynamicTypeMax","type":"number","default":null},{"name":"enter","type":"enum","default":null,"values":["fade","scale","slide-top","slide-bottom","slide-left","slide-right"]},{"name":"exit","type":"enum","default":null,"values":["fade","scale","slide-top","slide-bottom","slide-left","slide-right"]},{"name":"href","type":"string","default":null},{"name":"id","type":"string","default":null},{"name":"keep","type":"bool","default":"false"},{"name":"lockOrientation","type":"string","default":null},{"name":"measure","type":"state-key","default":null},{"name":"on:adjust","type":"action","default":null},{"name":"on:appear","type":"action","default":null},{"name":"on:disappear","type":"action","default":null},{"name":"on:drag","type":"action","default":null},{"name":"on:dragEnd","type":"action","default":null},{"name":"on:longpress","type":"action","default":null},{"name":"on:tap","type":"action","default":null},{"name":"passthrough","type":"bool","default":"false"},{"name":"ref","type":"string","default":null},{"name":"settle","type":"enum","default":"auto","values":["auto","manual"]},{"name":"shared","type":"string","default":null},{"name":"sharedAnim","type":"string","default":null},{"name":"sharedMode","type":"string","default":null},{"name":"sharedOrder","type":"string","default":null},{"name":"style","type":"string","default":null},{"name":"transition","type":"enum","default":null,"values":["fade","scale","slide-top","slide-bottom","slide-left","slide-right"]},{"name":"visible-if","type":"expr","default":null}]
actions: []
catalog: 0.1.0
commit: 4cfb269d9edbd23d395f2e7a0c771b0824e9f0d6
generator: ClosedSource/scripts/generate_component_docs.rb
---

# Universal attributes

Every element in the library carries all of these, so no component page repeats them. They are the reason a component page's attribute table is short: it lists only what that element adds.

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `a11yGroup` | `bool` |  | Children combine into one accessibility element. |
| `a11yHidden` | `bool` |  | Invisible to assistive tech (decorative). |
| `a11yHint` | `string` |  | Supplemental, read after a pause. |
| `a11yLabel` | `string` |  | What assistive tech reads aloud. |
| `a11yPressed` | `expr` |  | The pressed/toggled state of a custom control, mirrored to the web-standard aria-pressed spelling (mount.ts wireStyles). A tri-state control may also write "mixed". |
| `a11yTrait` | `button` \| `header` \| `image` \| `link` \| `selected` \| `static` |  | CSV accessibility roles. |
| `a11yValue` | `string` |  | The current value of a stateful element. |
| `anim` | `spring` \| `easeInOut` \| `easeIn` \| `easeOut` \| `linear` | `easeInOut` | Curve for transition/enter/keep. |
| `animDuration` | `number` (s) |  | Duration in seconds for anim. |
| `chrome` | `bool` | `false` | Global web chrome: this subtree is app furniture rather than page content, so an opacity route transition leaves it interactive and still. Native route hosts intentionally ignore this web-only motion hint. |
| `class` | `string` |  | Apply named <style as=…> classes / DSX-CSS classes (space-separated; later wins). |
| `container` | `bool` |  | Mark a query container: descendants read dsx.element.width / dsx.element.height (the CSS @container analogue). |
| `dismissEdge` | `string` |  | Declarative back-swipe: put it on a presented surface's root element (for example dismissEdge="left") and dragging from that edge dismisses the surface. |
| `dynamicType` | `bool` | `false` | Scale a fixed fontSize with the user's text-size setting (opt-in Dynamic Type). |
| `dynamicTypeMax` | `number` |  | Cap for the Dynamic Type scaled points. |
| `enter` | `fade` \| `scale` \| `slide-top` \| `slide-bottom` \| `slide-left` \| `slide-right` |  | Entry animation on first appear (incl. whole pages). |
| `exit` | `fade` \| `scale` \| `slide-top` \| `slide-bottom` \| `slide-left` \| `slide-right` |  | Root only: the declarative dismiss animation (the enter twin). |
| `href` | `string` |  | A link: a route path (`/show/{{ id }}`) the router pushes, or an absolute URL the platform opens. On any element - a card, a row, a plain text - so the text stays plain and the container is the link (a control that needs a background is a `<button>`). On a SNAPSHOT surface (widget / Live Activity / Glance) a relative path joins the app's own URL scheme and the root's href is the whole card's tap (Conformance/live-surfaces/links.json). |
| `id` | `string` |  | Stable id for imperative patches (ui.node("#id")). |
| `keep` | `bool` | `false` | Stay mounted when hidden and fade opacity instead of insert/remove (glass stays painted). |
| `lockOrientation` | `string` |  | F07b: pin the device orientation while this surface is presented. |
| `measure` | `state-key` |  | Write the element's live { width, height } to state - the explicit container-query primitive. |
| `on:adjust` | `action` |  | VoiceOver adjustable action for a custom on:drag control - dsx.this = { direction: "increment"\|"decrement", phase: "adjust" }. |
| `on:appear` | `action` |  | Runs when the element mounts. |
| `on:disappear` | `action` |  | Runs when the element unmounts. |
| `on:drag` | `action` |  | Raw drag - dsx.this = { fraction, fractionY, x, y, width, height, dx, dy, phase }. |
| `on:dragEnd` | `action` |  | Fires on drag release. |
| `on:longpress` | `action` |  | Long-press handler. |
| `on:tap` | `action` |  | Tap handler; on any element it is a tap gesture (announces as a button to assistive tech). |
| `passthrough` | `bool` | `false` | Decorative and non-interactive: the finger falls through this element and its subtree to whatever is behind (a legibility scrim over a tappable video, a fade bar over a scroller). iOS .allowsHitTesting(false), Compose a Box that does not consume, web pointer-events: none. |
| `ref` | `string` |  | Name this element so a MODULE can reach its live view: publishes the backing platform view under ref.`<name>` and withdraws on unmount. Consumers resolve it over the bus (capture.element, scroll.toElement, Spotlight). Exact case; whitespace-only is no ref; never published or since gone resolves as the typed unknown_ref absence. In a recycled list the last provider wins. Law: Conformance/input/ref.json. |
| `settle` | `auto` \| `manual` | `auto` | Root only: when this screen reports READINESS to the shell. auto = it settles on its first completed render pass; manual = it settles itself by calling dsx.screen.settled() (an `<api>` on:success, a loader finishing) - declare manual ONLY if you make that call, or the lint errors. Drives screen.loading/screen.ready + dsx.screen.ready. A frame hosting `<DSXWebView/>` waits for the page automatically, and every frame carries a 10s fail-open settle deadline - reference/screen-lifecycle.md. |
| `shared` | `string` |  | U03 shared-element transition: the match id for this rect. One id names one rect per frame; the router pairs the outgoing and incoming ends and flies between them. |
| `sharedAnim` | `string` |  | Curve override for this element's shared-element flight. |
| `sharedMode` | `string` |  | How a shared pair reconciles when the two ends differ: move \| crossfade \| clip. |
| `sharedOrder` | `string` |  | Ordering hint when several shared elements fly at once. |
| `style` | `string` |  | Inline DSX-CSS declarations or named styles - the style vocabulary lives in styleProperties ($ref). |
| `transition` | `fade` \| `scale` \| `slide-top` \| `slide-bottom` \| `slide-left` \| `slide-right` |  | Enter/leave animation when visible-if flips. |
| `visible-if` | `expr` |  | Show only when truthy. has:scheme = a module is installed. |

## Conventions

**units.** Lengths are points (pt) on iOS, the same numeric value as dp on Android.

**booleans.** Serialized as the strings "true" / "false".

**interpolation.** Any attribute value may contain {{ expr }} (JSE) and bind to the store - a panel can expose a per-field bind escape hatch.

**unknownAttributes.** Ignored by the engine (graceful degradation).

**platformSuffix.** Any attribute key may carry an exact :ios / :android / :web / :watch / :wear / :macos / :windows / :linux suffix, or the :desktop / :native group suffix. Precedence is exact > :desktop > :native > bare.

**argPrefix.** arg:`<key>`="value" attributes assemble a typed payload for dsx.send/dsx.event handlers.

**componentEvents.** A component invocation accepts on:`<event>` for every event its definition declares (events bubble to the nearest consumer).

**styleAttribute.** style="…" holds inline DSX-CSS declarations or named classes; the universal style vocabulary lives in styleProperties ($ref), not per element.

This page is GENERATED by ClosedSource/scripts/generate_component_docs.rb. A hand edit here is overwritten on the next run by design: fix the ledger instead (the attribute and event contract in `OpenSource/Documentation/reference/stack-elements.json`, the platform support and the audit in `OpenSource/Conformance/library/matrix.json`, the description and the web limits in `OpenSource/Web/support/element-support.json`, the specimen in `OpenSource/Catalog`).


---
title: Declarations
description: The tags that render nothing and declare everything: state, actions, formulas, events, styles and slots.
order: 3
section: components
element: 
category: structural
scope: structural
platforms: web,ios,android
properties: []
actions: []
catalog: 0.1.0
commit: e6eed2acf3432cb14315295020a6842d9b25b68f
generator: ClosedSource/scripts/generate_component_docs.rb
---

# Declarations

A declaration tag renders no DOM root on any renderer. It is logic, not markup, and it lives in the component's `<head>` in one canonical order: attributes, expects, events, api, variables (plain, then computed), formulas, actions, watch, style.

## `action`

Named, reusable logic (side effects, no return value) invoked as `<as>`() / dsx.action.`<as>`(). Parameterized like `<formula>`: as= plus named-input attributes bound in the caller scope. Body is bounded JS statements, read 1:1 (no XML escaping).

```dsx
<action as="addToCart" id="item.id" qty="1">dsx.variable.cart.push({ id: id, qty: qty }); dsx.module.haptic.success()</action>
```

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `as` | `string` |  | The action name. |

## `attribute`

Declares a component attribute (prop) this component consumes: `dsx.attribute.<as>` with an optional default expression; `on:change` watches the consumer-supplied value. The machine-readable Props: table.

```dsx
<attribute as="accent" default="'#FF2D55'"/>
```

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `as` | `string` |  | The attribute name (the identifier is as=, everywhere). |
| `default` | `expr` |  | JSE expression used when the consumer omits the attribute. |
| `on:change` | `action` |  | Watches the consumer-supplied value. |

## `component`

Inline component definition: registers its subtree as a reusable component scoped to the current module (exactly like a Components/`<Name>`.dsx file) and renders nothing where it stands. Idempotent; shadows a same-name file component in its scope.

```dsx
<component as="Badge"><text value="{{ dsx.attribute.label }}"/></component>
```

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `as` | `string` |  | The component name (Capitalized tag). |

## `event`

Declares an event this component raises via dsx.event('`<as>`') - the outbound contract (lint-checked against the literal dsx.event calls in the file).

```dsx
<event as="select" payload="id"/>
```

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `as` | `string` |  | The event name. |
| `payload` | `string` |  | Space-separated payload key names. |

## `expects`

The seed contract: state the mounting side must seed (ui.variable / vars:) or shared surface state a fragment reads. A missing seed logs one tick after mount.

```dsx
<expects variable="downloads"/>
```

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `variable` | `string` |  | The store variable name this document expects to be seeded. |

## `formula`

A reactive function with named inputs: every attribute other than as= is an input expression evaluated where the formula is read; the body uses those names as locals. Read as a value (no parentheses).

```dsx
<formula as="lineTotal" qty="item.qty" price="item.price">return qty * price</formula>
```

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `as` | `string` |  | The formula name. |

## `head`

The ONE place declarations live - first child of the root, at most one per element. Renders nothing; its children are declarations in canonical order: attribute → expects → event/input/tool → api/variable (plain → computed) → formula → action → script → watch → style → component.

```dsx
<vstack><head><variable as="count">return 0</variable></head><text value="{{ dsx.variable.count }}"/></vstack>
```

## `node`

The data-driven tag: <node tag="{{ item.view }}"/> resolves to any tag compiled into this binary (an unknown tag renders nothing - remote content can never name a view the app can't render). A bare `<node>` renders its children.

```dsx
<node tag="{{ item.view }}"/>
```

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `tag` | `expr` |  | The tag name to resolve (interpolatable). |

## `script`

A function library: every function name(params) { … } in the body registers as a callable (positional args, recursion depth-capped) usable in any expression or action body.

```dsx
<script>function double(n) { return n * 2 }</script>
```

## `slot`

Inside a component template: renders the children the caller passed (in the caller's data scope). name= for named slots; callers mark a child with slot="`<name>`".

```dsx
<slot name="footer"/>
```

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `name` | `string` |  | The slot name (omit for the default slot). |

## `style`

A named style (class): as= plus any style attributes from the style catalog; applied with class="`<as>`" (or the legacy style="`<as>`" selector). Explicit attrs on an element win over the class.

```dsx
<style as="pill" radius="16" paddingH="12" paddingV="6"/>
```

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `as` | `string` |  | The class name. |

## `tool`

Declares an action this document exposes to an AI AGENT (WebMCP, proposals/webmcp.md). The row names one action the same head declares and carries NO schema: the descriptor an agent reads is derived from that action's declared inputs. On the web renderer the rows register with document.modelContext while the document is mounted; on a native surface the row is declarative.

```dsx
<tool action="addTodo" description="Add a new item to the user's todo list." mutates="todos"/>
```

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `action` | `string` |  | The action this tool exposes. Must be declared by this same document (a stale target fails the build). |
| `as` | `string` |  | The tool name an agent sees. Defaults to the action name; 1 to 128 characters of ASCII letters, digits, "_", "-" or ".". |
| `description` | `string` |  | What the tool does, in plain language. This is what an agent reads to choose it, and it is untrusted text that changes no policy. |
| `mutates` | `string` |  | What this action changes when it changes anything. Its ABSENCE is what emits the read-only hint, and its presence is the approval gate. |

## `variable`

State: runs once for the initial value of a mutable store var (body is bounded JSE; a single expression is the value, multi-line returns via return). computed="true" makes it a reactive, read-only derivation evaluated per read in the current scope.

```dsx
<variable as="openCount" computed="true">dsx.variable.todos.filter(t => !t.done).length</variable>
```

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `as` | `string` |  | The variable name (dsx.variable.`<as>`). |
| `computed` | `bool` | `false` | true → reactive read-only derivation (pure, bounded). |

## `watch`

A reactive observer for side effects: runs on:change whenever value settles to a new value, in the watch's own scope (inside a list row it observes that row). immediate="true" also fires once on mount. The one declaration allowed OUTSIDE the head (inside a list/grid/pager row template).

```dsx
<watch value="dsx.variable.query" on:change="dsx.action.search()"/>
```

| Attribute | Type | Default | Notes |
|---|---|---|---|
| `immediate` | `bool` | `false` | Also fire once on mount. |
| `on:change` | `action` |  | Runs when the value changes; dsx.this is the new value. |
| `value` | `expr` |  | The observed expression. |

This page is GENERATED by ClosedSource/scripts/generate_component_docs.rb. A hand edit here is overwritten on the next run by design: fix the ledger instead (the attribute and event contract in `OpenSource/Documentation/reference/stack-elements.json`, the platform support and the audit in `OpenSource/Conformance/library/matrix.json`, the description and the web limits in `OpenSource/Web/support/element-support.json`, the specimen in `OpenSource/Catalog`).


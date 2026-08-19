---
title: Despia documentation
description: One set of DSX documents, rendered as native iOS, native Android, an installable PWA and a server-rendered site.
order: 0
section:
---

# Despia documentation

Write DSX documents once and ship them four ways: a native iOS app, a native Android app, an installable PWA, and a server-rendered site.

Despia is a web-optional native runtime. None of the four targets is a port; the semantics are pinned by shared conformance corpora that every renderer must pass identically. The same markup that renders this page renders a `UIStackView` on iOS and a Compose column on Android.

```sh
npm create dsx@latest my-app
cd my-app
npm install
npx dsx dev
```

## Where to start

- **[Quickstart](/quickstart)** takes you from an empty directory to a running app.
- **[The design system](/system)** is a living page: every element the grammar ships, rendered by the same runtime this site documents.
- **[The combination matrix](/framework/guides/combinations)** shows every supported way of pairing Despia with what you already have: a web app you keep, a backend you keep, a vendor's API, or nothing yet.
- **[Writing a backend](/framework/skills/writing-a-backend)** is the whole server story: routes, workers, MCP tools, one deploy command.

## This site is the proof

These pages are themselves a DSX application: markdown compiled to DSX documents, server-rendered on Cloudflare Workers by `@despia/server`, searched client-side from a build-time index, and served to agents over the site's own MCP face at `/mcp`. Every page serves its raw markdown under `/md`, and the whole site is summarized at [/llms.txt](/llms.txt).

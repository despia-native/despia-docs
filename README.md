# Despia Docs

The documentation platform for [Despia](https://github.com/despia-native/despia), and a
Despia app itself. The site you read at [docs.despia.com](https://docs.despia.com) is built
from this repository with the same framework it documents: DSX documents, server-side
rendering through `@despia/server`, search backed by a `<server>` route, and its own MCP
server so agents can read the docs natively. Every feature of the site doubles as a working
demonstration, which is the point.

## What ships from here

- The documentation site: server-side rendered, fast, light and dark, no client framework
  underneath it but Despia's own.
- Fuzzy search compiled at build time, vector search served by a Despia backend route.
- A raw markdown twin of every page, a copy-as-markdown control, and `llms.txt` at the
  root, so the docs are as readable to an agent as to a person.
- The docs MCP server: search, fetch-page and list-sections as tools, served from the same
  document that defines the site's routes.

Content comes from two places: the framework documentation and skills synced from
[`despia-native/despia`](https://github.com/despia-native/despia) (`Documentation/` and
`Skills/`), and the product guides authored here.

## Status

Version 0.0.1 of the framework is the first public release, and this site is being built in
the open on top of it. Until it goes live, the same content is readable at
[docs.despia.com](https://docs.despia.com) and in the
[`Documentation/`](https://github.com/despia-native/despia/tree/main/Documentation) tree of
the front door.

## Issues and contributions

Bugs in the documentation site itself belong here. Framework bugs, feature requests, and
everything else belong on
[`despia-native/despia`](https://github.com/despia-native/despia/issues), the single
tracker. The contribution flow, the DCO sign-off, and what makes a change land are in
[CONTRIBUTING.md](https://github.com/despia-native/despia/blob/main/CONTRIBUTING.md).
Maintained by the Despia team as part of daily work.

## License

[Apache License 2.0](LICENSE).

---

Proudly built in the United Arab Emirates 🇦🇪

Despia LLC-FZ · Dubai, United Arab Emirates · [despia.com](https://despia.com) · support@despia.com

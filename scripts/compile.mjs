#!/usr/bin/env node
//
//  compile.mjs — the docs content compiler: a markdown tree in, a DSX site out.
//
//  This is the MDX idea with DSX as the component model, kept deliberately small: every
//  page is a markdown file with front matter; the compiler turns the tree into
//    · one generated DSX page component per document (the <markdown> element renders it —
//      block vocabulary corpus-pinned, innerHTML-free on every renderer),
//    · the route table (dsx.config.json "routes", from file paths + front matter),
//    · the navigation model (nav.json: sections and pages, ordered),
//    · the client search index (public/search-index.json — title/heading/body tokens per
//      page; fuzzy search runs client-side with no server dependency),
//    · the raw-markdown siblings (public/md/<route>.md — every page serves its source, the
//      copy-as-markdown contract),
//    · llms.txt and llms-full.txt at the site root.
//
//  Repo-local by design (v0-live-plan W7.1): it is extracted to a published package only
//  when a second consumer exists. No dependencies — front matter and markdown structure
//  are parsed with the same do-little discipline the runtime's own parser keeps.
//

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = join(root, "content");
const generatedDir = join(root, "Components", "pages");
const publicDir = join(root, "public");

/** Front matter: a leading `---` block of `key: value` lines. Absent is fine. */
function frontMatter(source) {
  if (!source.startsWith("---\n")) return { meta: {}, body: source };
  const end = source.indexOf("\n---", 4);
  if (end === -1) return { meta: {}, body: source };
  const meta = {};
  for (const line of source.slice(4, end).split("\n")) {
    const at = line.indexOf(":");
    if (at === -1) continue;
    meta[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return { meta, body: source.slice(end + 4).replace(/^\n/, "") };
}

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (name.name.startsWith(".")) continue;
    const abs = join(dir, name.name);
    if (name.isDirectory()) out.push(...walk(abs));
    else if (name.name.endsWith(".md")) out.push(abs);
  }
  return out;
}

/** file path → route: content/index.md → /, content/guides/ota.md → /guides/ota */
function routeFor(file) {
  const rel = relative(contentDir, file).split(sep).join("/").replace(/\.md$/, "");
  if (rel === "index") return "/";
  return "/" + rel.replace(/\/index$/, "");
}

/** route → the generated component's name (fieldless, deterministic, collision-free) */
function componentNameFor(route) {
  if (route === "/") return "PageIndex";
  return "Page" + route.split("/").filter(Boolean).map((s) => s.replace(/(^|[-_])([a-z0-9])/g, (_, __, c) => c.toUpperCase())).join("_");
}

function firstHeading(body) {
  const m = /^#\s+(.+)$/m.exec(body);
  return m === null ? null : m[1].trim();
}

/** The searchable text: headings weighted by repetition, prose with markup stripped. */
function searchText(body) {
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*`_\[\]()|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeForDsxAttr(source) {
  return source.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** The page body as a JSE STRING LITERAL. A `<variable>` body is a raw code tag, so the
 *  markdown travels as data — a `{{ }}` inside a code example stays four literal braces on
 *  screen instead of becoming a live interpolation, and the linter never sees phantom
 *  bindings. `</` is escaped inside the string so the raw scan can never end early. */
function jseStringLiteral(source) {
  return JSON.stringify(source).replace(/<\//g, "<\\/");
}

const files = walk(contentDir);
if (files.length === 0) {
  console.error("[docs.compile] content/ holds no markdown — nothing to build");
  process.exit(1);
}

rmSync(generatedDir, { recursive: true, force: true });
mkdirSync(generatedDir, { recursive: true });
mkdirSync(join(publicDir, "md"), { recursive: true });

const pages = files.map((file) => {
  const source = readFileSync(file, "utf8");
  const { meta, body } = frontMatter(source);
  const route = meta.route ?? routeFor(file);
  const title = meta.title ?? firstHeading(body) ?? relative(contentDir, file);
  const section = meta.section ?? (route === "/" ? "" : route.split("/")[1]);
  return {
    file,
    route,
    title,
    section,
    order: Number(meta.order ?? 1000),
    description: meta.description ?? "",
    body,
    component: componentNameFor(route),
  };
}).sort((a, b) => a.order - b.order || (a.route < b.route ? -1 : 1));

const duplicate = pages.map((p) => p.route).filter((r, i, all) => all.indexOf(r) !== i);
if (duplicate.length > 0) {
  console.error(`[docs.compile] duplicate route(s): ${[...new Set(duplicate)].join(" · ")}`);
  process.exit(1);
}

// ── the generated page components ─────────────────────────────────────────────────────────
for (const page of pages) {
  const mdRoute = page.route === "/" ? "/md/index.md" : `/md${page.route}.md`;
  writeFileSync(join(generatedDir, `${page.component}.dsx`), `<stack style="gap: 0">
  <head>
    <!-- GENERATED by scripts/compile.mjs from ${relative(root, page.file).split(sep).join("/")} — edit the markdown, not this file. -->
    <variable as="body">return ${jseStringLiteral(page.body)}</variable>
  </head>
  <DocShell title="${escapeForDsxAttr(page.title)}" route="${page.route}" md="${mdRoute}">
    <markdown bind="dsx.variable.body"/>
  </DocShell>
</stack>
`);
  const mdOut = join(publicDir, "md", ...(page.route === "/" ? ["index.md"] : (page.route.slice(1) + ".md").split("/")));
  mkdirSync(dirname(mdOut), { recursive: true });
  writeFileSync(mdOut, readFileSync(page.file));
}

// ── the route table + nav model ───────────────────────────────────────────────────────────
const config = JSON.parse(readFileSync(join(root, "dsx.config.json"), "utf8"));
config.routes = pages.map((p) => ({
  path: p.route,
  component: `docs.${p.component}`,
  meta: { title: p.title, ...(p.description !== "" ? { description: p.description } : {}) },
}));
writeFileSync(join(root, "dsx.config.json"), JSON.stringify(config, null, 2) + "\n");

const sections = [];
for (const page of pages) {
  const name = page.section === "" ? "Start" : page.section.replace(/(^|-)([a-z])/g, (_, __, c) => " " + c.toUpperCase()).trim();
  let section = sections.find((s) => s.name === name);
  if (section === undefined) { section = { name, pages: [] }; sections.push(section); }
  section.pages.push({ route: page.route, title: page.title });
}
writeFileSync(join(publicDir, "nav.json"), JSON.stringify({ sections }, null, 1) + "\n");

// ── the client search index ───────────────────────────────────────────────────────────────
writeFileSync(join(publicDir, "search-index.json"), JSON.stringify({
  pages: pages.map((p) => ({
    route: p.route,
    title: p.title,
    section: p.section,
    text: searchText(p.body).slice(0, 4000),
  })),
}, null, 1) + "\n");

// ── llms.txt + llms-full.txt ──────────────────────────────────────────────────────────────
const site = "https://docs.despia.com";
writeFileSync(join(publicDir, "llms.txt"), [
  "# Despia documentation",
  "",
  "> Documentation for Despia, the web-optional native runtime: one set of DSX documents",
  "> rendered as native iOS, native Android, an installable PWA and a server-rendered site.",
  "",
  "Every page serves its raw markdown at the sibling path under /md/.",
  "",
  ...sections.flatMap((s) => [
    `## ${s.name}`,
    "",
    ...s.pages.map((p) => `- [${p.title}](${site}${p.route === "/" ? "/md/index.md" : `/md${p.route}.md`})`),
    "",
  ]),
].join("\n"));
writeFileSync(join(publicDir, "llms-full.txt"),
  pages.map((p) => `# ${p.title}\n(${site}${p.route})\n\n${p.body}`).join("\n\n---\n\n"));

console.log(`[docs.compile] ${pages.length} page(s) → Components/pages, routes, nav, search index, md copies, llms.txt`);

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
import { generateComponentPages } from "./generate-components.mjs";

// The component reference pages regenerate first (from the front-door ledgers, when
// present), so the walk below always compiles the current supported set.
generateComponentPages();

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

/** file path → route: content/index.md → /, content/guides/ota.md → /guides/ota.
 *  A README.md is a directory's front page (the synced framework docs use README, not
 *  index): guides/combinations/README.md → /guides/combinations, so in-content links
 *  to the directory route resolve. */
function routeFor(file) {
  const rel = relative(contentDir, file).split(sep).join("/").replace(/\.md$/, "");
  if (rel === "index" || rel === "README") return "/";
  return "/" + rel.replace(/\/(index|README)$/, "");
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

// ── the sidebar label map ─────────────────────────────────────────────────────────────────
// Display names for the nav (title-cased, short); page h1s keep the source title. A route
// missing here derives: components split camelCase, everything else trims the title to the
// clause before a colon (or a spaced dash) and drops a trailing parenthetical.
const COMPONENT_LABELS = {
  hstack: "HStack", vstack: "VStack", zstack: "ZStack", qrcode: "QR Code", otp: "OTP",
  svg: "SVG", contextmenu: "Context Menu", confirmdialog: "Confirm Dialog",
  datepicker: "Date Picker", rangeslider: "Range Slider", searchbar: "Search Bar",
  textfield: "Text Field", textarea: "Text Area", menubar: "Menu Bar",
  chatbubble: "Chat Bubble", progressring: "Progress Ring", radiogroup: "Radio Group",
  segmentedbutton: "Segmented Button",
};
const PAGE_LABELS = {
  "/": "Introduction",
  "/quickstart": "Quickstart",
  "/system": "Design system",
  "/framework/guides": "Overview",
  "/framework/skills": "Overview",
  "/framework/guides/codemagic-build": "Codemagic iOS build",
  "/framework/guides/combinations": "Combination matrix",
  "/framework/guides/combinations/c1-pure-dsx-app": "C1 · Pure DSX app",
  "/framework/guides/combinations/c2-web-app-plus-native": "C2 · Web app + native",
  "/framework/guides/combinations/c3-existing-app-despia-backend": "C3 · Despia backend only",
  "/framework/guides/combinations/c5-dsx-frontend-vendor-backend": "C5 · DSX + vendor backend",
  "/framework/guides/combinations/c7-self-hosted-ota": "C7 · Self-hosted OTA",
  "/framework/guides/despia-api": "The window.dsx API",
  "/framework/guides/native-export": "Native export",
  "/framework/guides/quickstart": "DSX quickstart",
  "/framework/skills/module-content": "Module content",
  "/framework/skills/module-state": "Module context",
  "/framework/skills/writing-a-module-internal": "Writing a module: internal",
  "/framework/skills/js-core": "JS core globals",
};
function componentLabel(route, title) {
  const slug = route.split("/").pop();
  if (COMPONENT_LABELS[slug] !== undefined) return COMPONENT_LABELS[slug];
  const spaced = String(title).replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
function pageLabel(page) {
  if (PAGE_LABELS[page.route] !== undefined) return PAGE_LABELS[page.route];
  if (page.route.startsWith("/components/")) return componentLabel(page.route, page.title);
  let label = String(page.title).replace(/`/g, "");
  label = label.split(/\s+[—–-]\s+|:\s+/)[0];
  label = label.replace(/\s*\([^)]*\)\s*$/, "");
  label = label.replace(/[—–]/g, "-");
  return label.trim() === "" ? page.title : label.trim();
}

/** nav section id for a route: the framework tree splits into Guides and Skills. */
function sectionFor(route, meta) {
  if (meta.section !== undefined && meta.section !== "framework") return meta.section;
  if (route.startsWith("/framework/guides")) return "guides";
  if (route.startsWith("/framework/skills")) return "skills";
  return route === "/" ? "" : route.split("/")[1];
}
const SECTION_RANK = { "": 0, guides: 1, components: 2, skills: 3 };

// ── the section splitter (rail anchors) ───────────────────────────────────────────────────
// A page body splits at its h2/h3 headings (fence-aware) so each section renders as its
// own <markdown> inside an anchor wrapper. The web renderer emits no DOM id, so the
// wrapper carries the slug as a `doc-anchor-<slug>` class token; the docs enhancement
// script promotes it to a real id (progressive enhancement, /public/docs.js).
function headingText(inline) {
  return inline.replace(/`([^`]*)`/g, "$1").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~]/g, "").replace(/\s+/g, " ").trim();
}
function slugFor(text, taken) {
  let slug = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-");
  if (slug === "") slug = "section";
  let unique = slug;
  let n = 2;
  while (taken.has(unique)) { unique = `${slug}-${n}`; n += 1; }
  taken.add(unique);
  return unique;
}
function sectionize(body) {
  const taken = new Set();
  const chunks = [{ id: "", title: "", level: 0, lines: [] }];
  let fence = null;
  for (const line of body.split("\n")) {
    const opener = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (fence !== null) {
      chunks[chunks.length - 1].lines.push(line);
      if (opener !== null && opener[1].startsWith(fence[0]) && opener[1].length >= fence.length) fence = null;
      continue;
    }
    if (opener !== null) {
      fence = opener[1];
      chunks[chunks.length - 1].lines.push(line);
      continue;
    }
    const heading = /^(##|###)\s+(.+?)\s*$/.exec(line);
    if (heading !== null) {
      const title = headingText(heading[2]);
      chunks.push({ id: slugFor(title, taken), title, level: heading[1].length, lines: [line] });
      continue;
    }
    chunks[chunks.length - 1].lines.push(line);
  }
  for (const chunk of chunks) chunk.body = chunk.lines.join("\n");
  return chunks.filter((chunk) => chunk.level > 0 || chunk.body.trim() !== "");
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
  const section = sectionFor(route, meta);
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

/** Hand-authored pages: real DSX documents at the Components root (never generated —
 *  this compiler owns and wipes only Components/pages). Each entry joins the route
 *  table, the nav model and the search index exactly like a compiled page; having no
 *  markdown source, they stay out of the /md siblings and the llms exports. */
const handAuthored = [
  {
    route: "/system",
    component: "System",
    title: "System",
    section: "",
    order: 2,
    description: "The design system as a living page: every element in its states.",
    search: "design system gallery elements states buttons fields selection toggle segmented picker slider stepper list rows cards surfaces tabs sheet typography color tokens spacing radius",
  },
];

const entries = [...pages, ...handAuthored].sort((a, b) => a.order - b.order || (a.route < b.route ? -1 : 1));

const duplicate = entries.map((p) => p.route).filter((r, i, all) => all.indexOf(r) !== i);
if (duplicate.length > 0) {
  console.error(`[docs.compile] duplicate route(s): ${[...new Set(duplicate)].join(" · ")}`);
  process.exit(1);
}

// ── the nav model (sections in reading rank, display labels, prev/next order) ─────────────
const sections = [];
for (const page of entries) {
  const name = page.section === "" ? "Start" : page.section.replace(/(^|-)([a-z])/g, (_, __, c) => " " + c.toUpperCase()).trim();
  let section = sections.find((s) => s.name === name);
  if (section === undefined) { section = { name, rank: SECTION_RANK[page.section] ?? 9, pages: [] }; sections.push(section); }
  section.pages.push({ route: page.route, title: page.title, label: pageLabel(page), section: name });
}
sections.sort((a, b) => a.rank - b.rank);
const flatNav = sections.flatMap((s) => s.pages);
const neighborsOf = (route) => {
  const at = flatNav.findIndex((p) => p.route === route);
  return { prev: at > 0 ? flatNav[at - 1] : null, next: at >= 0 && at < flatNav.length - 1 ? flatNav[at + 1] : null };
};

// ── the generated page components ─────────────────────────────────────────────────────────
for (const page of pages) {
  const mdRoute = page.route === "/" ? "/md/index.md" : `/md${page.route}.md`;
  const chunks = sectionize(page.body);
  const toc = chunks.filter((c) => c.level > 0).map((c) => ({ id: c.id, title: c.title, level: c.level }));
  const { prev, next } = neighborsOf(page.route);
  const sectionName = flatNav.find((p) => p.route === page.route)?.section ?? "";
  const vars = chunks.map((chunk, i) =>
    `    <variable as="md${i}">return ${jseStringLiteral(chunk.body)}</variable>`).join("\n");
  const blocks = chunks.map((chunk, i) => chunk.level === 0
    ? `    <markdown bind="dsx.variable.md${i}"/>`
    : `    <stack class="doc-section doc-anchor-${chunk.id}"><markdown bind="dsx.variable.md${i}"/></stack>`).join("\n");
  const shellAttrs = [
    `title="${escapeForDsxAttr(page.title)}"`,
    `label="${escapeForDsxAttr(pageLabel(page))}"`,
    `route="${page.route}"`,
    `md="${mdRoute}"`,
    `section="${escapeForDsxAttr(sectionName)}"`,
    `toc="${escapeForDsxAttr(JSON.stringify(toc))}"`,
    ...(prev !== null ? [`prev="${prev.route}"`, `prevLabel="${escapeForDsxAttr(prev.label)}"`] : []),
    ...(next !== null ? [`next="${next.route}"`, `nextLabel="${escapeForDsxAttr(next.label)}"`] : []),
  ].join(" ");
  writeFileSync(join(generatedDir, `${page.component}.dsx`), `<scroll theme="{{ dsx.global.docs &amp;&amp; dsx.global.docs.theme ? dsx.global.docs.theme : '' }}" style="background: background">
  <head>
    <!-- GENERATED by scripts/compile.mjs from ${relative(root, page.file).split(sep).join("/")} - edit the markdown, not this file. -->
${vars}
  </head>
  <DocShell ${shellAttrs}>
${blocks}
  </DocShell>
</scroll>
`);
  const mdOut = join(publicDir, "md", ...(page.route === "/" ? ["index.md"] : (page.route.slice(1) + ".md").split("/")));
  mkdirSync(dirname(mdOut), { recursive: true });
  writeFileSync(mdOut, readFileSync(page.file));
}

// ── the generated sidebar (DocNav) ────────────────────────────────────────────────────────
// The whole nav model as static markup: every row a real SSR'd anchor, grouped under
// uppercase micro-labels, the active row resolved from the route attribute at render
// time (class formula, S1). No api fetch, no client dependency.
const navRows = sections.map((section) => {
  const label = `  <text value="${escapeForDsxAttr(section.name)}" class="doc-nav-label"/>`;
  const rows = section.pages.map((p) =>
    `  <pressable href="${p.route}" on:tap="dsx.event('navigate')" class="doc-nav-link{{ dsx.attribute.route === '${p.route}' ? ' is-active' : '' }}"><text value="${escapeForDsxAttr(p.label)}" class="doc-nav-text"/></pressable>`);
  return [label, ...rows].join("\n");
}).join("\n");
writeFileSync(join(generatedDir, "DocNav.dsx"), `<stack class="doc-nav" role="navigation" a11yLabel="Documentation">
  <head>
    <!-- GENERATED by scripts/compile.mjs (the nav model as static markup) - edit the content tree, not this file. -->
    <attribute as="route" default="''"/>
    <event as="navigate"/>
  </head>
${navRows}
</stack>
`);

// ── the generated /system card wall (SystemCards) ─────────────────────────────────────────
// The component reference as a card grid: name + one-line role per card, every card a
// real anchor. Roles come from each reference page's front-matter description.
const cardRoleFor = (description) => {
  const clause = String(description).replace(/\.\s*$/, "").split(": ")[0].trim();
  return clause.charAt(0).toUpperCase() + clause.slice(1);
};
const cardRows = entries.filter((p) => p.route.startsWith("/components/")).map((p) =>
  `  <pressable href="${p.route}" class="doc-card">
    <text value="${escapeForDsxAttr(componentLabel(p.route, p.title))}" class="doc-card-name"/>
    <text value="${escapeForDsxAttr(cardRoleFor(p.description))}" class="doc-card-role"/>
  </pressable>`).join("\n");
writeFileSync(join(generatedDir, "SystemCards.dsx"), `<stack class="doc-cardwall">
  <head>
    <!-- GENERATED by scripts/compile.mjs (the component reference as a card grid). -->
  </head>
${cardRows}
</stack>
`);

// ── the route table ───────────────────────────────────────────────────────────────────────
const config = JSON.parse(readFileSync(join(root, "dsx.config.json"), "utf8"));
config.routes = entries.map((p) => ({
  path: p.route,
  component: `docs.${p.component}`,
  meta: { title: p.title, ...(p.description !== "" ? { description: p.description } : {}) },
}));
writeFileSync(join(root, "dsx.config.json"), JSON.stringify(config, null, 2) + "\n");

writeFileSync(join(publicDir, "nav.json"), JSON.stringify({
  sections: sections.map((s) => ({ name: s.name, pages: s.pages.map(({ route, title, label }) => ({ route, title, label })) })),
}, null, 1) + "\n");

// ── the client search index ───────────────────────────────────────────────────────────────
writeFileSync(join(publicDir, "search-index.json"), JSON.stringify({
  pages: entries.map((p) => ({
    route: p.route,
    title: p.title,
    label: pageLabel(p),
    section: p.section,
    text: (p.body === undefined ? (p.search ?? p.description) : searchText(p.body)).slice(0, 4000),
  })),
}, null, 1) + "\n");

// ── llms.txt + llms-full.txt ──────────────────────────────────────────────────────────────
// llms speaks markdown, so it lists only markdown-backed pages (hand-authored DSX has
// no /md sibling to link).
const mdRoutes = new Set(pages.map((p) => p.route));
const site = "https://docs.despia.com";
writeFileSync(join(publicDir, "llms.txt"), [
  "# Despia documentation",
  "",
  "> Documentation for Despia, the web-optional native runtime: one set of DSX documents",
  "> rendered as native iOS, native Android, an installable PWA and a server-rendered site.",
  "",
  "Every page serves its raw markdown at the sibling path under /md/.",
  "",
  ...sections.filter((s) => s.pages.some((p) => mdRoutes.has(p.route))).flatMap((s) => [
    `## ${s.name}`,
    "",
    ...s.pages.filter((p) => mdRoutes.has(p.route))
      .map((p) => `- [${p.title}](${site}${p.route === "/" ? "/md/index.md" : `/md${p.route}.md`})`),
    "",
  ]),
].join("\n"));
writeFileSync(join(publicDir, "llms-full.txt"),
  pages.map((p) => `# ${p.title}\n(${site}${p.route})\n\n${p.body}`).join("\n\n---\n\n"));

console.log(`[docs.compile] ${pages.length} page(s) + ${handAuthored.length} hand-authored → Components/pages (+ DocNav, SystemCards), routes, nav, search index, md copies, llms.txt`);

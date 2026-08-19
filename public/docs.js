// docs.js - progressive enhancement for the documentation shell. The page is fully
// usable without it (SSR markup, real anchors); this layer adds the details the
// runtime cannot express declaratively yet:
//   1. anchor ids: `doc-anchor-<slug>` class tokens promote to real element ids
//      (the web renderer emits no id attribute), scoped to the active route frame
//   2. rail scroll-spy: the "On this page" link for the section in view
//   3. aria-current="page" on the active sidebar link (the visual state is SSR'd)
//   4. cmd/ctrl+K or "/" focuses search; Escape clears it
//   5. rail clicks scroll in place (smooth only when motion is welcome)
(function () {
  "use strict";

  var reduced = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  function activeFrame() {
    var frames = document.querySelectorAll(".dsx-frame:not([inert])");
    return frames.length > 0 ? frames[frames.length - 1] : document;
  }

  function promoteAnchors() {
    var frame = activeFrame();
    document.querySelectorAll('[class*="doc-anchor-"]').forEach(function (el) {
      var inFrame = frame === document || frame.contains(el);
      if (!inFrame) { if (el.id) el.removeAttribute("id"); return; }
      var token = null;
      el.classList.forEach(function (t) { if (token === null && t.indexOf("doc-anchor-") === 0) token = t; });
      if (token !== null) el.id = token.slice("doc-anchor-".length);
    });
  }

  function markNav() {
    var path = location.pathname.replace(/\/+$/, "") || "/";
    document.querySelectorAll(".doc-nav-link").forEach(function (link) {
      var href = (link.getAttribute("data-dsx-href") || link.getAttribute("href") || "").replace(/\/+$/, "") || "/";
      if (href === path) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  var spyTicking = false;
  function spy() {
    spyTicking = false;
    var frame = activeFrame();
    var root = frame === document ? document.body : frame;
    var sections = root.querySelectorAll(".doc-section[id]");
    if (sections.length === 0) return;
    var currentId = sections[0].id;
    for (var i = 0; i < sections.length; i += 1) {
      if (sections[i].getBoundingClientRect().top <= 104) currentId = sections[i].id;
    }
    root.querySelectorAll('.doc-toc [data-dsx-href^="#"], .doc-toc a[href^="#"]').forEach(function (link) {
      var target = (link.getAttribute("data-dsx-href") || link.getAttribute("href")).slice(1);
      var current = target === currentId;
      link.classList.toggle("is-current", current);
      if (current) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }
  function queueSpy() {
    if (spyTicking) return;
    spyTicking = true;
    requestAnimationFrame(spy);
  }

  document.addEventListener("click", function (event) {
    var link = event.target && event.target.closest ? event.target.closest('.doc-toc [data-dsx-href^="#"], .doc-toc a[href^="#"]') : null;
    if (link === null) return;
    var id = (link.getAttribute("data-dsx-href") || link.getAttribute("href")).slice(1);
    var target = document.getElementById(id);
    if (target === null) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
    history.replaceState(history.state, "", "#" + id);
  });

  function searchInput() {
    var frame = activeFrame();
    var root = frame === document ? document : frame;
    var inline = root.querySelector(".doc-search-inline input");
    if (inline !== null && inline.offsetParent !== null) return inline;
    var row = root.querySelector(".doc-search-row input");
    if (row !== null && row.offsetParent !== null) return row;
    return null;
  }
  document.addEventListener("keydown", function (event) {
    var key = event.key ? event.key.toLowerCase() : "";
    var meta = event.metaKey || event.ctrlKey;
    var inField = /^(input|textarea|select)$/i.test(document.activeElement ? document.activeElement.tagName : "");
    if ((meta && key === "k") || (!meta && !inField && key === "/")) {
      var input = searchInput();
      if (input === null) {
        var frame = activeFrame();
        var toggle = (frame === document ? document : frame).querySelector(".doc-search-toggle");
        if (toggle !== null && toggle.offsetParent !== null) {
          toggle.click();
          requestAnimationFrame(function () {
            var opened = searchInput();
            if (opened !== null) opened.focus();
          });
          event.preventDefault();
        }
        return;
      }
      input.focus();
      input.select();
      event.preventDefault();
    } else if (key === "escape" && inField) {
      var active = document.activeElement;
      if (active.closest(".doc-search-inline, .doc-search-row") !== null && active.value !== "") {
        active.value = "";
        active.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  });

  // A region that scrolls its overflow must be keyboard-reachable (axe
  // scrollable-region-focusable). Sweep the active frame for scrollable boxes with
  // no focusable child and make them tabbable; the shell CSS carries the ring.
  var FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';
  function focusableScrollRegions() {
    var frame = activeFrame();
    var root = frame === document ? document.body : frame;
    root.querySelectorAll("pre, .dsx-md-table-wrap, .dsx-tab-panels").forEach(function (el) {
      if (el.hasAttribute("tabindex") || el.querySelector(FOCUSABLE) !== null) return;
      var scrollsX = el.scrollWidth > el.clientWidth + 1;
      var scrollsY = el.scrollHeight > el.clientHeight + 1;
      var style = getComputedStyle(el);
      var scrollable = /(auto|scroll)/.test(style.overflowX + " " + style.overflowY);
      if (scrollable && (scrollsX || scrollsY)) el.setAttribute("tabindex", "0");
    });
  }

  var refreshQueued = false;
  function refresh() {
    refreshQueued = false;
    promoteAnchors();
    markNav();
    focusableScrollRegions();
    spy();
    if (location.hash.length > 1) {
      var target = document.getElementById(location.hash.slice(1));
      if (target !== null && target.getBoundingClientRect().top > window.innerHeight) {
        target.scrollIntoView({ behavior: "auto", block: "start" });
      }
    }
  }
  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(refresh);
  }

  document.addEventListener("scroll", queueSpy, { passive: true, capture: true });
  window.addEventListener("popstate", queueRefresh);
  if (typeof MutationObserver !== "undefined") {
    new MutationObserver(queueRefresh).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refresh);
  else refresh();
})();

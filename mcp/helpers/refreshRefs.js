#!/usr/bin/env node
"use strict";

// Refresh refs in mcp/refs.json by parsing a saved Playwright MCP snapshot (YAML-like text).
// Usage:
//   node mcp/helpers/refreshRefs.js --page home --snapshot path/to/snapshot.txt
//   cat snapshot.txt | node mcp/helpers/refreshRefs.js --page home
//   (add --dry to preview without writing)

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const opts = { page: 'home', snapshot: null, dry: false, refsPath: path.join('mcp', 'refs.json') };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--page') opts.page = argv[++i];
    else if (a === '--snapshot') opts.snapshot = argv[++i];
    else if (a === '--refs') opts.refsPath = argv[++i];
    else if (a === '--dry') opts.dry = true;
    else if (a === '-h' || a === '--help') {
      console.log('Usage: refreshRefs.js --page <name> [--snapshot <file>] [--refs mcp/refs.json] [--dry]');
      process.exit(0);
    }
  }
  return opts;
}

function loadSnapshotText(opts) {
  if (opts.snapshot) return fs.readFileSync(opts.snapshot, 'utf8');
  // Read from stdin
  const stat = fs.fstatSync(0);
  if (stat.size > 0 || process.stdin.isTTY === false) {
    return fs.readFileSync(0, 'utf8');
  }
  throw new Error('No snapshot provided. Pass --snapshot <file> or pipe snapshot via stdin.');
}

function trimQuotes(s) {
  if (!s) return s;
  return s.replace(/^\"|\"$/g, '');
}

function parseBracketAttrs(s) {
  // Example: "level=2] [ref=e196] [checked] [active]
  const out = { flags: new Set() };
  if (!s) return out;
  const parts = s.split('][').map(x => x.replace(/^\[/, '').replace(/\]$/, ''));
  for (const p of parts) {
    if (!p) continue;
    const [k, v] = p.split('=');
    if (!v) out.flags.add(k.trim());
    else out[k.trim()] = v.trim();
  }
  return out;
}

function parseSnapshot(text) {
  const lines = text.split(/\r?\n/);
  const nodes = [];
  const stack = [];

  function pushNode(node) {
    while (stack.length && stack[stack.length - 1].indent >= node.indent) stack.pop();
    node.parent = stack.length ? stack[stack.length - 1] : null;
    nodes.push(node);
    stack.push(node);
  }

  // indexes for quick lookup
  const idx = {
    buttonByText: new Map(),
    checkboxByText: new Map(),
    headingByLevelText: new Map(), // key: `${level}\n${text}`
    headingLevelList: new Map(),   // key: `${level}` -> first ref
    linkByUrl: new Map(),
    sectionByHeadingLevelText: new Map(), // parent container ref of a heading
  };

  for (const raw of lines) {
    const line = raw.replace(/\t/g, '  ');
    const mNode = line.match(/^(\s*)-\s+([^\s]+)(?:\s+"([^"]+)")?(?:\s+\[([^\]]+)\])?/);
    const mUrl = line.match(/^(\s*)-\s+\/url:\s+"([^"]+)"/);

    if (mNode) {
      const indent = mNode[1].length;
      const type = mNode[2];
      const text = mNode[3] || '';
      const attrs = parseBracketAttrs(mNode[4]);
      const node = {
        indent,
        type,
        text,
        ref: attrs.ref || '',
        level: attrs.level ? Number(attrs.level) : undefined,
        checked: attrs.flags.has('checked') || false,
        active: attrs.flags.has('active') || false,
        url: undefined,
        attrs,
      };
      pushNode(node);

      // Build indexes
      if (node.type === 'button' && node.text) {
        if (!idx.buttonByText.has(node.text)) idx.buttonByText.set(node.text, node.ref);
      }
      if (node.type === 'checkbox' && node.text) {
        if (!idx.checkboxByText.has(node.text)) idx.checkboxByText.set(node.text, node.ref);
      }
      if (node.type === 'heading' && node.level) {
        const key = `${node.level}\n${node.text}`;
        if (!idx.headingByLevelText.has(key)) idx.headingByLevelText.set(key, node.ref);
        if (!idx.headingLevelList.has(String(node.level))) idx.headingLevelList.set(String(node.level), node.ref);
        // parent container mapping
        const parent = node.parent; // nearest container
        if (parent && parent.ref) {
          const skey = `h${node.level}:has-text(\"${node.text}\")`;
          if (!idx.sectionByHeadingLevelText.has(skey)) idx.sectionByHeadingLevelText.set(skey, parent.ref);
        }
        // one level higher container (grandparent) for broader panels
        const gp = node.parent && node.parent.parent;
        if (gp && gp.ref) {
          const skey2 = `panel:h${node.level}:has-text(\"${node.text}\")`;
          if (!idx.sectionByHeadingLevelText.has(skey2)) idx.sectionByHeadingLevelText.set(skey2, gp.ref);
        }
      }
      continue;
    }

    if (mUrl) {
      const indent = mUrl[1].length;
      const url = mUrl[2];
      // attach to nearest ancestor link
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
      const anc = stack.slice().reverse().find(n => n.type === 'link');
      if (anc) {
        anc.url = url;
        if (!idx.linkByUrl.has(url)) idx.linkByUrl.set(url, anc.ref);
      }
    }
  }
  return { nodes, idx };
}

function findRefForSelector(selector, idx) {
  // Supported patterns:
  // - button:has-text("TEXT")
  // - checkbox:has-text("TEXT") or input[type=checkbox][aria-label="TEXT"]
  // - hN:has-text("TEXT")
  // - hN (first occurrence)
  // - a[href="..."]
  // - section:has(hN:has-text("TEXT"))
  // - panel:has(hN:has-text("TEXT"))  (maps to grandparent)

  const btn = selector.match(/^button:has-text\("([\s\S]+)"\)$/);
  if (btn) return idx.buttonByText.get(btn[1]);

  const cb1 = selector.match(/^checkbox:has-text\("([\s\S]+)"\)$/);
  if (cb1) return idx.checkboxByText.get(cb1[1]);

  const cb2 = selector.match(/^input\[type=checkbox\]\[aria-label=\"([\s\S]+)\"\]$/);
  if (cb2) return idx.checkboxByText.get(cb2[1]);

  const hnText = selector.match(/^h([1-6]):has-text\("([\s\S]+)"\)$/);
  if (hnText) return idx.headingByLevelText.get(`${hnText[1]}\n${hnText[2]}`);

  const hnOnly = selector.match(/^h([1-6])$/);
  if (hnOnly) return idx.headingLevelList.get(hnOnly[1]);

  const linkHref = selector.match(/^a\[href=\"([\s\S]+)\"\]$/);
  if (linkHref) return idx.linkByUrl.get(linkHref[1]);

  const sectionHas = selector.match(/^section:has\(h([1-6]):has-text\(\"([\s\S]+)\"\)\)$/);
  if (sectionHas) return idx.sectionByHeadingLevelText.get(`h${sectionHas[1]}:has-text(\"${sectionHas[2]}\")`);

  const panelHas = selector.match(/^section:has\(h([1-6]):has-text\(\"([\s\S]+)\"\)\)$/);
  if (panelHas) return idx.sectionByHeadingLevelText.get(`panel:h${panelHas[1]}:has-text(\"${panelHas[2]}\")`);

  return undefined;
}

function main() {
  const opts = parseArgs(process.argv);
  const snapshotText = loadSnapshotText(opts);
  const { idx } = parseSnapshot(snapshotText);
  const refsPath = opts.refsPath;
  const data = JSON.parse(fs.readFileSync(refsPath, 'utf8'));
  const page = data.pages && data.pages[opts.page];
  if (!page) throw new Error(`Page '${opts.page}' not found in ${refsPath}`);
  const elements = page.elements || {};

  const changes = [];
  for (const [alias, meta] of Object.entries(elements)) {
    const sel = meta.selector;
    const fallback = meta.fallback;
    if (!sel && !fallback) continue;
    let newRef = undefined;
    if (sel) newRef = findRefForSelector(sel, idx);
    if (!newRef && fallback) newRef = findRefForSelector(fallback, idx);
    if (newRef && newRef !== meta.ref) {
      changes.push({ alias, from: meta.ref || '', to: newRef, selector: sel });
      meta.ref = newRef;
    }
  }

  if (!changes.length) {
    console.log('No ref updates found for page:', opts.page);
    return;
  }

  if (opts.dry) {
    console.log('Planned updates (dry run):');
    for (const c of changes) console.log(`- ${c.alias}: ${c.from} -> ${c.to} (${c.selector})`);
    return;
  }

  fs.writeFileSync(refsPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${refsPath} (${changes.length} refs):`);
  for (const c of changes) console.log(`- ${c.alias}: ${c.from} -> ${c.to}`);
}

if (require.main === module) {
  try { main(); }
  catch (e) { console.error(e.message || e); process.exit(1); }
}

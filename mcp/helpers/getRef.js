#!/usr/bin/env node
"use strict";

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const opts = { page: 'home', refsPath: path.join('mcp', 'refs.json') };
  const rest = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--page') opts.page = argv[++i];
    else if (a === '--refs') opts.refsPath = argv[++i];
    else if (a === '-h' || a === '--help') {
      console.log('Usage: getRef <alias> [--page home] [--refs mcp/refs.json]');
      process.exit(0);
    } else {
      rest.push(a);
    }
  }
  if (!rest.length) {
    console.error('Missing alias. Example: node mcp/helpers/getRef.js settingsButton');
    process.exit(1);
  }
  opts.alias = rest[0];
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);
  const data = JSON.parse(fs.readFileSync(opts.refsPath, 'utf8'));
  const page = data.pages && data.pages[opts.page];
  if (!page) throw new Error(`Page '${opts.page}' not found in ${opts.refsPath}`);
  const el = page.elements && page.elements[opts.alias];
  if (!el) throw new Error(`Alias '${opts.alias}' not found under page '${opts.page}'`);
  const ref = el.ref || '';
  if (!ref) {
    console.error(`Alias '${opts.alias}' has empty ref. Set it via refreshRefs.js`);
    process.exit(2);
  }
  process.stdout.write(ref + '\n');
}

if (require.main === module) {
  try { main(); }
  catch (e) { console.error(e.message || e); process.exit(1); }
}


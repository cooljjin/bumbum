#!/usr/bin/env node
"use strict";

// Create a compact handoff summary so you can start the next chat with minimal context.
// Usage: node mcp/helpers/handoff.js [--snapshot mcp/snapshot-home.txt] [--out mcp/handoff.md]

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const opts = { refsPath: path.join('mcp', 'refs.json'), snapshot: null, out: path.join('mcp', 'handoff.md') };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--refs') opts.refsPath = argv[++i];
    else if (a === '--snapshot') opts.snapshot = argv[++i];
    else if (a === '--out') opts.out = argv[++i];
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);
  const data = JSON.parse(fs.readFileSync(opts.refsPath, 'utf8'));
  const pages = data.pages || {};
  const lines = [];

  lines.push('# MCP Handoff');
  lines.push('');
  lines.push('- refs file: ' + opts.refsPath);
  if (opts.snapshot) lines.push('- snapshot: ' + opts.snapshot);
  lines.push('');

  for (const [pageName, page] of Object.entries(pages)) {
    lines.push(`## ${pageName}`);
    if (page.url) lines.push(`- url: ${page.url}`);
    const elements = page.elements || {};
    lines.push(`- aliases: ${Object.keys(elements).length}`);
    const preview = Object.entries(elements).slice(0, 12).map(([k, v]) => `  - ${k}: ${v.ref || ''}`);
    if (preview.length) {
      lines.push('- sample refs:');
      lines.push(...preview);
    }
    lines.push('');
  }

  lines.push('## Next Steps');
  lines.push('- Navigate to target URL');
  lines.push('- If refs fail: save snapshot → run `npm run mcp:refresh`');
  lines.push('- Use aliases (not snapshots) for actions');

  fs.writeFileSync(opts.out, lines.join('\n') + '\n', 'utf8');
  console.log('Wrote handoff summary to', opts.out);
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(e.message || e); process.exit(1); }
}


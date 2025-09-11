#!/usr/bin/env node
"use strict";

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function parseArgs(argv) {
  const opts = { page: 'home', dir: path.join('mcp', 'snapshots'), dry: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--page') opts.page = argv[++i];
    else if (a === '--dir') opts.dir = argv[++i];
    else if (a === '--dry') opts.dry = true;
  }
  return opts;
}

function getLatestSnapshot(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.txt'))
    .map(f => path.join(dir, f));
  if (!files.length) return null;
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

function main() {
  const opts = parseArgs(process.argv);
  const latest = getLatestSnapshot(opts.dir);
  if (!latest) {
    console.error('No snapshot files found in', opts.dir);
    process.exit(1);
  }
  const args = [
    path.join('mcp', 'helpers', 'refreshRefs.js'),
    '--page', opts.page,
    '--snapshot', latest
  ];
  if (opts.dry) args.push('--dry');
  const res = spawnSync(process.execPath, args, { stdio: 'inherit' });
  process.exit(res.status || 0);
}

if (require.main === module) main();


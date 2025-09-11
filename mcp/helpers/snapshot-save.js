#!/usr/bin/env node
"use strict";

const fs = require('fs');
const path = require('path');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) + '-' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function main() {
  const outDir = path.join('mcp', 'snapshots');
  ensureDir(outDir);

  // Read entire stdin
  const bufs = [];
  const stdin = process.stdin;
  if (stdin.isTTY) {
    console.error('No stdin provided. Pipe snapshot text into this command.');
    process.exit(1);
  }
  stdin.on('data', (c) => bufs.push(c));
  stdin.on('end', () => {
    const content = Buffer.concat(bufs).toString('utf8').trim();
    if (!content) {
      console.error('Snapshot content is empty.');
      process.exit(2);
    }
    const file = path.join(outDir, `snapshot-${ts()}.txt`);
    fs.writeFileSync(file, content + (content.endsWith('\n') ? '' : '\n'), 'utf8');
    process.stdout.write(file + '\n');
  });
}

if (require.main === module) main();


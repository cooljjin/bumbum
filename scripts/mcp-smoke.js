#!/usr/bin/env node
/*
 Simple MCP stdio handshake tester.
 Spawns a server command and sends an `initialize` request.
 Exits 0 if a valid JSON-RPC result is received, otherwise non‑zero.
 Usage: node scripts/mcp-smoke.js -- cmd arg1 arg2 ...
*/
const { spawn } = require('node:child_process');

function makeFrame(json) {
  const body = Buffer.from(JSON.stringify(json), 'utf8');
  const header = Buffer.from(
    `Content-Length: ${body.length}\r\nContent-Type: application/json\r\n\r\n`,
    'utf8'
  );
  return Buffer.concat([header, body]);
}

function parseFrames(buffer) {
  const messages = [];
  let offset = 0;
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n', offset);
    if (headerEnd === -1) break;
    const header = buffer.slice(offset, headerEnd).toString('utf8');
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) break;
    const length = parseInt(match[1], 10);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + length;
    if (buffer.length < bodyEnd) break;
    const jsonStr = buffer.slice(bodyStart, bodyEnd).toString('utf8');
    try {
      const obj = JSON.parse(jsonStr);
      messages.push(obj);
    } catch (_) {}
    offset = bodyEnd;
  }
  return { messages, rest: buffer.slice(offset) };
}

async function main() {
  const sep = process.argv.indexOf('--');
  if (sep === -1 || sep === process.argv.length - 1) {
    console.error('Usage: node scripts/mcp-smoke.js -- <command> [args...]');
    process.exit(2);
  }
  const cmd = process.argv[sep + 1];
  const args = process.argv.slice(sep + 2);

  const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
  let stdoutBuf = Buffer.alloc(0);
  let stderrBuf = Buffer.alloc(0);
  let resolved = false;

  const timeoutMs = parseInt(process.env.MCP_SMOKE_TIMEOUT || '15000', 10);
  const timer = setTimeout(() => {
    if (resolved) return;
    resolved = true;
    console.error('Timeout waiting for initialize response');
    try { child.kill('SIGKILL'); } catch (_) {}
    process.exit(1);
  }, timeoutMs);

  child.on('error', (err) => {
    if (resolved) return;
    resolved = true;
    clearTimeout(timer);
    console.error('Failed to spawn:', err.message);
    process.exit(1);
  });

  child.stderr.on('data', (d) => { stderrBuf = Buffer.concat([stderrBuf, d]); });
  child.stdout.on('data', (d) => {
    stdoutBuf = Buffer.concat([stdoutBuf, d]);
    const { messages, rest } = parseFrames(stdoutBuf);
    stdoutBuf = rest;
    for (const msg of messages) {
      if (msg.id === 1 && (msg.result || msg.error)) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          // best‑effort shutdown
          try { child.kill('SIGTERM'); } catch (_) {}
          if (msg.result) {
            console.log('initialize ok');
            process.exit(0);
          } else {
            console.error('initialize error');
            console.error(JSON.stringify(msg.error));
            process.exit(1);
          }
        }
      }
    }
  });

  // Send initialize
  const initialize = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      clientInfo: { name: 'mcp-smoke', version: '0.1.0' },
      capabilities: {},
      protocolVersion: '2024-11-05',
    },
  };
  child.stdin.write(makeFrame(initialize));
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});

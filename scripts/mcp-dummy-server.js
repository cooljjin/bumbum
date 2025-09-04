#!/usr/bin/env node
// Minimal MCP stdio server for handshake testing.
// Speaks JSON-RPC 2.0 over headers + body framing (Content-Length, Content-Type).

function readStdin(callback) {
  let buf = Buffer.alloc(0);
  process.stdin.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    while (true) {
      const headerEnd = buf.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;
      const header = buf.slice(0, headerEnd).toString('utf8');
      const m = header.match(/Content-Length:\s*(\d+)/i);
      if (!m) { buf = buf.slice(headerEnd + 4); continue; }
      const len = parseInt(m[1], 10);
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + len;
      if (buf.length < bodyEnd) break;
      const body = buf.slice(bodyStart, bodyEnd).toString('utf8');
      buf = buf.slice(bodyEnd);
      try {
        const msg = JSON.parse(body);
        callback(msg);
      } catch (_) {
        // ignore parse errors
      }
    }
  });
}

function writeMessage(json) {
  const payload = Buffer.from(JSON.stringify(json), 'utf8');
  const header = Buffer.from(
    `Content-Length: ${payload.length}\r\nContent-Type: application/json\r\n\r\n`,
    'utf8'
  );
  process.stdout.write(Buffer.concat([header, payload]));
}

// Handle messages
readStdin((msg) => {
  if (msg && msg.method === 'initialize') {
    const result = {
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'dummy-mcp-server', version: '0.1.0' },
        capabilities: { tools: {} },
      },
    };
    writeMessage(result);
  } else if (msg && msg.id != null) {
    // Echo response for any other requests
    writeMessage({ jsonrpc: '2.0', id: msg.id, result: { ok: true } });
  }
});

// Keep process alive
process.stdin.resume();


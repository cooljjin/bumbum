#!/usr/bin/env node
/*
 Minimal MCP client over TCP sockets.
 Connects to an MCP server (e.g., Blender add-on) listening on host:port,
 performs the initialize handshake, and optionally lists tools.

 Usage:
   node scripts/mcp-tcp-client.js --host 127.0.0.1 --port 9876 [--list-tools]

 Env:
   MCP_TCP_TIMEOUT (ms) default 15000
*/
const net = require('node:net');

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

function parseArgs(argv) {
  const out = { host: '127.0.0.1', port: 9876, listTools: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--host' && i + 1 < argv.length) { out.host = argv[++i]; continue; }
    if (a === '--port' && i + 1 < argv.length) { out.port = parseInt(argv[++i], 10); continue; }
    if (a === '--list-tools') { out.listTools = true; continue; }
  }
  return out;
}

async function main() {
  const { host, port, listTools } = parseArgs(process.argv);
  const timeoutMs = parseInt(process.env.MCP_TCP_TIMEOUT || '15000', 10);

  const socket = new net.Socket();
  let buf = Buffer.alloc(0);
  let nextId = 2; // 1 reserved for initialize
  const pending = new Map();

  function send(json) {
    socket.write(makeFrame(json));
  }

  function request(method, params) {
    const id = nextId++;
    const payload = { jsonrpc: '2.0', id, method, params };
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Timeout waiting for response to ${method}`));
      }, timeoutMs);
      pending.set(id, (msg) => { clearTimeout(t); resolve(msg); });
      send(payload);
    });
  }

  const timer = setTimeout(() => {
    console.error(`Timeout connecting to ${host}:${port}`);
    try { socket.destroy(); } catch (_) {}
    process.exit(1);
  }, timeoutMs);

  socket.on('error', (err) => {
    clearTimeout(timer);
    console.error('Socket error:', err.message);
    process.exit(1);
  });

  socket.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    const { messages, rest } = parseFrames(buf);
    buf = rest;
    for (const msg of messages) {
      if (msg.id != null && pending.has(msg.id)) {
        const cb = pending.get(msg.id);
        pending.delete(msg.id);
        cb(msg);
      } else if (msg.id === 1 && (msg.result || msg.error)) {
        // initialize response without using request() path
        if (pending.has(1)) { const cb = pending.get(1); pending.delete(1); cb(msg); }
      } else {
        // notifications or unrelated messages
        // Best-effort log for debugging
        if (msg.method && !msg.id) {
          console.log('[notify]', msg.method);
        }
      }
    }
  });

  socket.connect(port, host, async () => {
    clearTimeout(timer);
    // Send initialize
    const initialize = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        clientInfo: { name: 'mcp-tcp-client', version: '0.1.0' },
        capabilities: {},
        protocolVersion: '2024-11-05',
      },
    };
    try {
      const initResp = await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('initialize timeout')), timeoutMs);
        pending.set(1, (msg) => { clearTimeout(t); resolve(msg); });
        send(initialize);
      });

      if (initResp.error) {
        console.error('initialize error:', JSON.stringify(initResp.error));
        socket.end();
        process.exit(1);
      }
      console.log('initialize ok');
      if (initResp.result) {
        console.log('serverInfo:', initResp.result.serverInfo || '(none)');
        if (initResp.result.capabilities) {
          console.log('capabilities:', Object.keys(initResp.result.capabilities));
        }
      }

      if (listTools) {
        try {
          const tools = await request('tools/list', {});
          if (tools.error) {
            console.error('tools/list error:', JSON.stringify(tools.error));
          } else {
            console.log('tools:', JSON.stringify(tools.result || tools, null, 2));
          }
        } catch (e) {
          console.error('tools/list failed:', e.message);
        }
      }
    } catch (e) {
      console.error('Handshake failed:', e.message);
      try { socket.end(); } catch (_) {}
      process.exit(1);
    }

    // Allow a brief window for any server notifications, then close.
    setTimeout(() => { try { socket.end(); } catch (_) {} }, 300);
  });
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});


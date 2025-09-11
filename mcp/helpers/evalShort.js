#!/usr/bin/env node
"use strict";

// Minimal helper to build short-return Playwright MCP evaluate functions.
// Usage (CLI):
//   node mcp/helpers/evalShort.js fn "document.title" --maxLen 120
//   node mcp/helpers/evalShort.js el "element.textContent" --maxLen 120

function buildFunctionBody(expression, opts = {}) {
  const {
    maxLen = 200,
    maxItems = 20,
    maxDepth = 3,
  } = opts;

  // Body runs inside the page. Keep it self-contained (no external deps).
  return `{
    const MAX_LEN = ${Number(maxLen)};
    const MAX_ITEMS = ${Number(maxItems)};
    const MAX_DEPTH = ${Number(maxDepth)};

    const seen = new WeakSet();
    const truncate = (v, depth = 0) => {
      if (depth > MAX_DEPTH) return '[depth limit]';
      if (v == null) return v;
      const t = typeof v;
      if (t === 'string') return v.length > MAX_LEN ? v.slice(0, MAX_LEN) + '…' : v;
      if (t === 'number' || t === 'boolean') return v;
      if (t === 'bigint') return String(v) + 'n';
      if (t === 'function') return '[function]';
      if (t === 'symbol') return String(v);
      if (Array.isArray(v)) return v.slice(0, MAX_ITEMS).map(x => truncate(x, depth + 1));

      if (t === 'object') {
        if (seen.has(v)) return '[circular]';
        seen.add(v);
        // Handle DOM Nodes/Elements succinctly
        if (v instanceof Node) {
          const tag = v.nodeType === 1 ? v.tagName.toLowerCase() : v.nodeName;
          const text = v.textContent ? v.textContent.trim().slice(0, MAX_LEN) : '';
          return `[${tag}]` + (text ? ` ${text}` : '');
        }
        const out = {};
        const keys = Object.keys(v).slice(0, MAX_ITEMS);
        for (const k of keys) out[k] = truncate(v[k], depth + 1);
        return out;
      }
      try { return String(v); } catch (_) { return '[unserializable]'; }
    };

    const __value = (${expression});
    return truncate(__value);
  }`;
}

function buildEvaluateFunction(expression, opts = {}) {
  return `() => ${buildFunctionBody(expression, opts)}`;
}

function buildEvaluateOnElement(expression, opts = {}) {
  return `(element) => ${buildFunctionBody(expression, opts)}`;
}

module.exports = {
  buildEvaluateFunction,
  buildEvaluateOnElement,
};

// Simple CLI for convenience
if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'fn';
  let expr = '';
  const opts = { maxLen: 200, maxItems: 20, maxDepth: 3 };

  // naive arg parsing to avoid deps
  const rest = [];
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === '--maxLen') { opts.maxLen = Number(args[++i]); continue; }
    if (a === '--maxItems') { opts.maxItems = Number(args[++i]); continue; }
    if (a === '--maxDepth') { opts.maxDepth = Number(args[++i]); continue; }
    rest.push(a);
  }
  expr = rest.join(' ').trim();
  if (!expr) {
    console.error('Usage: evalShort.js <fn|el> "<expression>" [--maxLen N] [--maxItems N] [--maxDepth N]');
    process.exit(1);
  }
  const out = cmd === 'el' ? buildEvaluateOnElement(expr, opts) : buildEvaluateFunction(expr, opts);
  process.stdout.write(out + '\n');
}


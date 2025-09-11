#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" + pad(d.getMonth() + 1) +
    "-" + pad(d.getDate()) +
    "T" + pad(d.getHours()) +
    "-" + pad(d.getMinutes()) +
    "-" + pad(d.getSeconds())
  );
}

function parseArgs(argv) {
  const args = { title: "Checkpoint", notes: "", limit: 2000, include: "snapshot,status" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--title=")) args.title = a.slice(8);
    else if (a.startsWith("--notes=")) args.notes = a.slice(8);
    else if (a.startsWith("--limit=")) args.limit = Number(a.slice(8)) || args.limit;
    else if (a.startsWith("--include=")) args.include = a.slice(10);
  }
  return args;
}

function safeExec(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function trimTo(str, limit) {
  if (!str) return "";
  if (str.length <= limit) return str;
  return str.slice(0, limit) + `\n... [truncated ${str.length - limit} chars]`;
}

function getGitContext(limit) {
  const isRepo = !!safeExec("git rev-parse --is-inside-work-tree");
  if (!isRepo) return { repo: false };
  const branch = safeExec("git rev-parse --abbrev-ref HEAD");
  const statusRaw = safeExec("git status --porcelain");
  const status = statusRaw
    ? statusRaw.split(/\r?\n/).filter(Boolean).map((l) => l.trim())
    : [];
  const diff = safeExec("git diff");
  const stagedDiff = safeExec("git diff --cached");
  return {
    repo: true,
    branch,
    status,
    diffExcerpt: trimTo(diff, Math.floor(limit / 2)),
    stagedDiffExcerpt: trimTo(stagedDiff, Math.floor(limit / 2)),
  };
}

function getMcpSnapshot(limit) {
  const snapshotPath = path.join("mcp", "snapshot-home.txt");
  if (!fs.existsSync(snapshotPath)) return null;
  const content = fs.readFileSync(snapshotPath, "utf8");
  return {
    snapshotFile: snapshotPath,
    snapshotChars: content.length,
    snapshotExcerpt: trimTo(content, limit),
  };
}

function main() {
  const args = parseArgs(process.argv);
  const includes = new Set(
    args.include
      .split(/[,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );

  const outDir = path.join("data", "memory", "checkpoints");
  ensureDir(outDir);

  const createdAt = new Date().toISOString();
  const stamp = ts();

  const payload = {
    id: `chk-${stamp}`,
    title: args.title,
    notes: args.notes,
    createdAt,
    includes: Array.from(includes),
  };

  if (includes.has("status") || includes.has("diff") || includes.has("git")) {
    payload.git = getGitContext(args.limit);
  }
  if (includes.has("snapshot") || includes.has("mcp")) {
    payload.mcp = getMcpSnapshot(args.limit);
  }

  // Derive a quick file list from git status if available
  if (payload.git && payload.git.status && payload.git.status.length) {
    payload.filesTouched = payload.git.status
      .map((l) => l.replace(/^\S+\s+/, ""))
      .filter(Boolean);
  }

  const outFile = path.join(outDir, `checkpoint-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + "\n", "utf8");
  process.stdout.write(outFile + "\n");
}

if (require.main === module) main();


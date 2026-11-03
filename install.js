#!/usr/bin/env node
// Installs statusline.sh into your Claude Code config dir and points settings.json at it.
// Cross-platform (Windows / macOS / Linux). Only the "statusLine" key in settings.json is changed;
// both files are backed up before being overwritten.
//
// Usage:  node install.js            install / update
//         node install.js --dry-run  show what would change, write nothing

const fs = require("fs");
const os = require("os");
const path = require("path");

const dryRun = process.argv.includes("--dry-run");
const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
const settingsPath = path.join(configDir, "settings.json");
const scriptSrc = path.join(__dirname, "statusline.sh");
const scriptDest = path.join(configDir, "statusline.sh");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

// Use ~ in the command when installing to the default location so settings stay portable;
// otherwise use an absolute path with forward slashes (bash on Windows needs them).
const usingDefaultDir = !process.env.CLAUDE_CONFIG_DIR;
const scriptRef = usingDefaultDir ? "~/.claude/statusline.sh" : scriptDest.replace(/\\/g, "/");
const statusLine = { type: "command", command: `bash ${scriptRef}` };

const log = msg => console.log((dryRun ? "[dry-run] " : "") + msg);
const backup = file => {
  const dest = `${file}.bak-${stamp}`;
  if (!dryRun) fs.copyFileSync(file, dest);
  log(`backed up ${file} -> ${dest}`);
};

// 1. Read and validate settings.json BEFORE touching anything, so a bad file aborts cleanly.
let settings = {};
let settingsExisted = fs.existsSync(settingsPath);
if (settingsExisted) {
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch (e) {
    console.error(`ERROR: ${settingsPath} is not valid JSON (${e.message}). Fix it and re-run. Nothing was changed.`);
    process.exit(1);
  }
  if (typeof settings !== "object" || settings === null || Array.isArray(settings)) {
    console.error(`ERROR: ${settingsPath} must contain a JSON object. Nothing was changed.`);
    process.exit(1);
  }
}

// 2. Copy the script.
if (!dryRun) fs.mkdirSync(configDir, { recursive: true });
const newScript = fs.readFileSync(scriptSrc);
if (fs.existsSync(scriptDest) && fs.readFileSync(scriptDest).equals(newScript)) {
  log(`${scriptDest} already up to date`);
} else {
  if (fs.existsSync(scriptDest)) backup(scriptDest);
  if (!dryRun) {
    fs.writeFileSync(scriptDest, newScript);
    try { fs.chmodSync(scriptDest, 0o755); } catch {}
  }
  log(`installed ${scriptDest}`);
}

// 3. Set the statusLine key.
if (JSON.stringify(settings.statusLine) === JSON.stringify(statusLine)) {
  log(`${settingsPath} already has the right statusLine`);
} else {
  if (settings.statusLine !== undefined) log(`replacing existing statusLine: ${JSON.stringify(settings.statusLine)}`);
  if (settingsExisted) backup(settingsPath);
  settings.statusLine = statusLine;
  if (!dryRun) fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  log(`set statusLine in ${settingsPath} -> ${JSON.stringify(statusLine)}`);
}

log("done. Start a new Claude Code session to see the status line.");

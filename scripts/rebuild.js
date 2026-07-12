#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

// 1. Delete .next and webpack cache
for (const dir of [".next", "node_modules/.cache/webpack"]) {
  try { fs.rmSync(path.join(root, dir), { recursive: true, force: true }); console.log("Deleted", dir); } catch {}
}

// 2. Wait for Windows to flush
setTimeout(() => {
  console.log("-> Running next build...\n");
  try {
    execSync("npx next build", { stdio: "inherit", cwd: root });
  } catch {
    // First attempt can fail on Windows due to manifest race; retry once after a pause
    console.log("\n-> First build attempt failed, retrying in 3s...\n");
    setTimeout(() => {
      try { execSync("npx next build", { stdio: "inherit", cwd: root }); }
      catch { process.exit(1); }
    }, 3000);
  }
}, 3000);

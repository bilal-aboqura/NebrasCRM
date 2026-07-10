#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const nextDir = path.join(__dirname, "..", ".next");
try { fs.rmSync(nextDir, { recursive: true, force: true }); console.log("Deleted .next"); } catch (e) {}
setTimeout(() => {
  try { execSync("npx next build", { stdio: "inherit", cwd: path.join(__dirname, "..") }); }
  catch { process.exit(1); }
}, 500);

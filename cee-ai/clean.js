/**
 * CEE-AI Workspace Clean Script
 * Cross-platform workspace cleanup script for Node.js environments.
 * 
 * Safely removes:
 * 1. Next.js build output (.next/)
 * 2. Prettier/TypeScript build caches (*.tsbuildinfo)
 * 3. Deployed build folder if present (build/, out/)
 * 4. Dependencies (node_modules/) - optional, defaults to retaining unless requested via arg
 */

const fs = require("fs");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m"
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function removeDirOrFile(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return;
  }
  
  try {
    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      log(`✓ Removed directory: ${path.basename(targetPath)}`, colors.green);
    } else {
      fs.unlinkSync(targetPath);
      log(`✓ Removed file: ${path.basename(targetPath)}`, colors.green);
    }
  } catch (error) {
    log(`✗ Failed to remove ${targetPath}: ${error.message}`, colors.red);
  }
}

log(`\n======================================================`, colors.cyan);
log(`         CEE-AI Workspace Cleanup Script              `, colors.bold + colors.yellow);
log(`======================================================\n`, colors.cyan);

// Targets to clean always
const targets = [
  path.join(__dirname, ".next"),
  path.join(__dirname, "out"),
  path.join(__dirname, "build"),
  path.join(__dirname, "tsconfig.tsbuildinfo")
];

// If '--all' argument is provided, remove node_modules as well
const cleanAll = process.argv.includes("--all");
if (cleanAll) {
  targets.push(path.join(__dirname, "node_modules"));
  log(`Performing full clean (including node_modules)...`, colors.yellow);
} else {
  log(`Performing standard clean (retaining node_modules)...`, colors.yellow);
  log(`To delete node_modules as well, run: npm run clean -- --all\n`, colors.cyan);
}

targets.forEach(target => {
  removeDirOrFile(target);
});

log(`\n======================================================`, colors.cyan);
log(`✓ CEE-AI Workspace cleanup complete!`, colors.bold + colors.green);
log(`======================================================\n`, colors.cyan);

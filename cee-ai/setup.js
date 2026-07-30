/**
 * CEE-AI Setup Automation Script
 * Cross-platform installer for Node.js environments.
 *
 * Steps:
 * 1. Validates Node.js version (>= 18.0.0)
 * 2. Checks and copies .env.example to .env if it doesn't exist
 * 3. Installs NPM package dependencies
 * 4. Generates Prisma DB client types
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ANSI color outputs
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

function runCommand(command, desc) {
  log(`\n> ${desc}...`, colors.cyan);
  log(`Command: ${command}`, colors.yellow);
  try {
    execSync(command, { stdio: "inherit" });
    log(`✓ ${desc} completed successfully.`, colors.green);
    return true;
  } catch (err) {
    log(`✗ ${desc} failed.`, colors.red);
    return false;
  }
}

log(`\n======================================================`, colors.cyan);
log(`         CEE-AI Development Workspace Setup           `, colors.bold + colors.green);
log(`======================================================\n`, colors.cyan);

// 1. Verify Node.js version
const requiredMajor = 18;
const currentVersion = process.version;
const currentMajor = parseInt(currentVersion.replace("v", "").split(".")[0], 10);

log(`Checking Node.js version...`);
log(`Current version: ${currentVersion}`);
if (currentMajor < requiredMajor) {
  log(`✗ Error: CEE-AI requires Node.js version v${requiredMajor}.0.0 or higher.`, colors.red);
  log(`  Download it from https://nodejs.org`, colors.yellow);
  process.exit(1);
}
log(`✓ Node.js version is compatible.`, colors.green);

// 2. Setup environment file
log(`\nChecking environment variables...`);
const envPath = path.join(__dirname, ".env");
const envExamplePath = path.join(__dirname, ".env.example");

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    log(`Copying .env.example template to .env...`, colors.yellow);
    try {
      fs.copyFileSync(envExamplePath, envPath);
      log(`✓ Created .env file successfully.`, colors.green);
      log(`  ⚠  Remember to fill in your credentials in .env before starting.`, colors.yellow);
    } catch (copyErr) {
      log(`✗ Failed to copy .env file: ${copyErr.message}`, colors.red);
    }
  } else {
    log(`⚠  Warning: .env.example was not found in the root directory.`, colors.yellow);
  }
} else {
  log(`✓ .env file already exists. Skipping template copy.`, colors.green);
}

// 3. Install NPM packages
const npmInstallSuccess = runCommand("npm install", "Installing package dependencies");
if (!npmInstallSuccess) {
  log(`✗ Setup terminated due to dependency installation failure.`, colors.red);
  process.exit(1);
}

// 4. Generate Prisma Client types
const prismaSchemaPath = path.join(__dirname, "prisma", "schema.prisma");
if (fs.existsSync(prismaSchemaPath)) {
  const prismaGenSuccess = runCommand("npx prisma generate", "Generating Prisma Client types");
  if (!prismaGenSuccess) {
    log(`⚠  Warning: Prisma client generation failed. Check your schema.prisma file.`, colors.yellow);
    log(`   You can retry manually: npx prisma generate`, colors.yellow);
  }
} else {
  log(`\nPrisma schema not found at prisma/schema.prisma. Skipping client generation.`, colors.yellow);
}

log(`\n======================================================`, colors.cyan);
log(`✓ CEE-AI Workspace setup is complete!`, colors.bold + colors.green);
log(`\nNext Steps:`, colors.cyan);
log(`  1. Edit '.env' with your Supabase, Gemini, and database credentials.`);
log(`  2. Push the schema:    npx prisma db push`);
log(`  3. Seed demo data:     npx prisma db seed`);
log(`  4. Start dev server:   npm run dev`);
log(`\nDev commands:`, colors.cyan);
log(`  npm run dev        — Start development server (Turbopack)`);
log(`  npm run build      — Build for production`);
log(`  npm run start      — Start production server`);
log(`  npm run lint src   — Run ESLint`);
log(`  npm run typecheck  — Run TypeScript checks`);
log(`  npm run format     — Format with Prettier`);
log(`\n======================================================\n`, colors.cyan);

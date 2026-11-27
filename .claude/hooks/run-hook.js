#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

function readStdinJson() {
  try {
    const raw = fs.readFileSync(0, "utf8").trim();
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getTargetPath(input) {
  return input.file_path || input.path || input.filePath || "";
}

function findNearestTsconfigDir(targetPath, rootDir) {
  const resolvedRoot = path.resolve(rootDir);
  let current = path.dirname(path.resolve(resolvedRoot, targetPath));
  while (true) {
    if (fs.existsSync(path.join(current, "tsconfig.json"))) {
      return current;
    }
    const parent = path.dirname(current);
    const rel = path.relative(resolvedRoot, current);
    if (parent === current || rel === "" || rel.startsWith("..")) {
      return null;
    }
    current = parent;
  }
}

function handleDevServerGate(input) {
  const cmd = input.command || "";
  if (
    process.platform !== "win32" &&
    /\b(npm|pnpm|yarn)\s+(run\s+)?(dev|start(:dev)?)\b/.test(cmd) &&
    !process.env.TMUX &&
    process.env.ECC_ALLOW_DEV_WITHOUT_TMUX !== "1"
  ) {
    process.stderr.write(
      "[Hook] Blocked: Run development server inside a tmux session on Unix to maintain log access and prevent detached hanging processes. (Set ECC_ALLOW_DEV_WITHOUT_TMUX=1 to bypass)\n",
    );
    return 2;
  }
  return 0;
}

function scanAddedDiffViolations(stagedDiff) {
  const secretRe =
    /(BEGIN\s+[A-Z ]*PRIVATE KEY|(?:JEV_|TYPESAFE_)?API_KEY\s*=\s*['"]?[A-Za-z0-9_\-]{8,})/;
  const debugRe = /\b(console\.log\s*\(|debugger\b)/;

  let currentFile = "";
  const violations = [];

  for (const line of stagedDiff.split(/\r?\n/)) {
    if (line.startsWith("+++ b/")) {
      currentFile = line.slice(6).replace(/\\/g, "/");
      continue;
    }
    if (!line.startsWith("+") || line.startsWith("+++")) {
      continue;
    }
    const added = line.slice(1);
    const isExample = /\.example$/i.test(currentFile);
    const isHookRunner = /(?:^|\/)hooks\/run-hook\.js$/i.test(currentFile);

    if (!isExample && !isHookRunner && secretRe.test(added)) {
      violations.push(`secret pattern in ${currentFile || "staged diff"}`);
      continue;
    }

    const isProdCode =
      /\.(ts|tsx|js|jsx)$/i.test(currentFile) &&
      !/\.(spec|test|e2e-spec)\.[tj]sx?$/i.test(currentFile) &&
      !currentFile.startsWith(".claude/");

    if (isProdCode && debugRe.test(added)) {
      violations.push(`debug statement in ${currentFile}`);
    }
  }
  return violations;
}

function handlePreCommitQualityGate(input, cwd) {
  const cmd = input.command || "";
  if (!/\bgit\s+commit\b/.test(cmd)) {
    return 0;
  }

  let stagedDiff = "";
  try {
    stagedDiff = execFileSync("git", ["diff", "--cached", "--unified=0", "--no-color"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return 0;
  }

  const violations = scanAddedDiffViolations(stagedDiff);
  if (violations.length > 0) {
    process.stderr.write(
      `[Hook] Quality Gate blocked commit: ${violations.slice(0, 3).join("; ")}. Clean up before committing.\n`,
    );
    return 2;
  }
  return 0;
}

function handleRootDocHygiene(input, cwd) {
  const targetPath = getTargetPath(input);
  if (!targetPath) {
    return 0;
  }

  const rel = path.relative(cwd, path.resolve(cwd, targetPath));
  const isRootFile = rel && !rel.includes("/") && !rel.includes("\\") && !rel.startsWith("..");
  const isDocExt = /\.(md|txt)$/i.test(rel);
  const isStandardDoc =
    /^(README|CLAUDE|AGENTS|DESIGN|CONTRIBUTING|CHANGELOG|LICENSE)\.(md|txt)$/i.test(rel);

  if (isRootFile && isDocExt && !isStandardDoc) {
    process.stderr.write(
      "[Hook] Warning: Writing non-standard documentation file to repository root. Prefer docs/ or specifications under designated directories.\n",
    );
  }
  return 0;
}

function handleTypescriptVerification(input, cwd) {
  const targetPath = getTargetPath(input);
  if (!/\.(ts|tsx)$/i.test(targetPath)) {
    return 0;
  }

  const pkgDir = findNearestTsconfigDir(targetPath, cwd);
  if (!pkgDir) {
    return 0;
  }

  const tscBin = path.join(pkgDir, "node_modules", "typescript", "bin", "tsc");
  if (!fs.existsSync(tscBin)) {
    return 0;
  }

  try {
    execFileSync(process.execPath, [tscBin, "--noEmit", "--pretty"], {
      cwd: pkgDir,
      encoding: "utf8",
      timeout: 25000,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    const details = [err.stdout, err.stderr].filter(Boolean).join("\n").trim();
    if (details) {
      process.stderr.write(`${details.slice(0, 2000)}\n`);
    }
    process.stderr.write(
      `[Hook] TypeScript compiler errors detected in ${path.relative(cwd, pkgDir) || "."}.\n`,
    );
  }
  return 0;
}

function main() {
  const hookName = process.argv[2];
  const payload = readStdinJson();
  const input = payload.tool_input || {};
  const cwd = payload.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();

  let exitCode = 0;
  switch (hookName) {
    case "dev-server-gate":
      exitCode = handleDevServerGate(input);
      break;
    case "pre-commit-quality-gate":
      exitCode = handlePreCommitQualityGate(input, cwd);
      break;
    case "root-doc-hygiene":
      exitCode = handleRootDocHygiene(input, cwd);
      break;
    case "typescript-verification":
      exitCode = handleTypescriptVerification(input, cwd);
      break;
    default:
      exitCode = 0;
      break;
  }

  process.exit(exitCode);
}

main();

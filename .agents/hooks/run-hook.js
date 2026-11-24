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

function getTargetPath(args) {
  return args.Path || args.TargetFile || args.path || args.filePath || "";
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

function handleDevServerGate(args) {
  const cmd = args.CommandLine || args.command || "";
  if (
    process.platform !== "win32" &&
    /\b(npm|pnpm|yarn)\s+(run\s+)?(dev|start(:dev)?)\b/.test(cmd) &&
    !process.env.TMUX &&
    process.env.ECC_ALLOW_DEV_WITHOUT_TMUX !== "1"
  ) {
    return {
      decision: "deny",
      reason:
        "[Hook] Blocked: Run development server inside a tmux session on Unix to maintain log access and prevent detached hanging processes. (Set ECC_ALLOW_DEV_WITHOUT_TMUX=1 to bypass)",
    };
  }
  return { decision: "allow" };
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
      !currentFile.startsWith(".agents/");

    if (isProdCode && debugRe.test(added)) {
      violations.push(`debug statement in ${currentFile}`);
    }
  }
  return violations;
}

function handlePreCommitQualityGate(args, cwd) {
  const cmd = args.CommandLine || args.command || "";
  if (!/\bgit\s+commit\b/.test(cmd)) {
    return { decision: "allow" };
  }

  let stagedDiff = "";
  try {
    stagedDiff = execFileSync("git", ["diff", "--cached", "--unified=0", "--no-color"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return { decision: "allow" };
  }

  const violations = scanAddedDiffViolations(stagedDiff);
  if (violations.length > 0) {
    return {
      decision: "deny",
      reason: `[Hook] Quality Gate blocked commit: ${violations.slice(0, 3).join("; ")}. Clean up before committing.`,
    };
  }
  return { decision: "allow" };
}

function handleRootDocHygiene(args, cwd) {
  const targetPath = getTargetPath(args);
  if (!targetPath) {
    return { decision: "allow" };
  }

  const rel = path.relative(cwd, path.resolve(cwd, targetPath));
  const isRootFile = rel && !rel.includes("/") && !rel.includes("\\") && !rel.startsWith("..");
  const isDocExt = /\.(md|txt)$/i.test(rel);
  const isStandardDoc =
    /^(README|CLAUDE|AGENTS|DESIGN|CONTRIBUTING|CHANGELOG|LICENSE)\.(md|txt)$/i.test(rel);

  if (isRootFile && isDocExt && !isStandardDoc) {
    const warning =
      "[Hook] Warning: Writing non-standard documentation file to repository root. Prefer docs/ or specifications under designated directories.";
    process.stderr.write(`${warning}\n`);
    return { decision: "allow", reason: warning };
  }
  return { decision: "allow" };
}

function handleTypescriptVerification(args, cwd) {
  const targetPath = getTargetPath(args);
  if (!/\.(ts|tsx)$/i.test(targetPath)) {
    return {};
  }

  const pkgDir = findNearestTsconfigDir(targetPath, cwd);
  if (!pkgDir) {
    return {};
  }

  const tscBin = path.join(pkgDir, "node_modules", "typescript", "bin", "tsc");
  if (!fs.existsSync(tscBin)) {
    return {};
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
  return {};
}

function main() {
  const hookName = process.argv[2];
  const payload = readStdinJson();
  const args = (payload.toolCall && payload.toolCall.args) || {};
  const cwd = payload.cwd || process.cwd();

  let output;
  switch (hookName) {
    case "dev-server-gate":
      output = handleDevServerGate(args);
      break;
    case "pre-commit-quality-gate":
      output = handlePreCommitQualityGate(args, cwd);
      break;
    case "root-doc-hygiene":
      output = handleRootDocHygiene(args, cwd);
      break;
    case "typescript-verification":
      output = handleTypescriptVerification(args, cwd);
      break;
    default:
      output = hookName === "typescript-verification" ? {} : { decision: "allow" };
      break;
  }

  process.stdout.write(`${JSON.stringify(output)}\n`);
}

main();

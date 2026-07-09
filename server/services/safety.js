import path from "node:path";

// Patterns that must never be executed or written out as "instructions to run".
// This is a hard block, not a suggestion - any match rejects the round outright.
const DESTRUCTIVE_PATTERNS = [
  /rm\s+-rf\s+\/(?!\S)/i,
  /rm\s+-rf\s+~/i,
  /rm\s+-rf\s+\*/i,
  /:\(\)\s*\{\s*:\|:&\s*\}\s*;\s*:/, // fork bomb
  /mkfs(\.\w+)?\s+\/dev/i,
  /dd\s+if=.*of=\/dev\/(sda|nvme|disk)/i,
  />\s*\/dev\/sd[a-z]/i,
  /git\s+push\s+.*--force/i,
  /drop\s+(table|database)\s+/i,
  /del\s+\/f\s+\/s\s+\/q/i,
  /format\s+[a-z]:/i,
  /shutdown\s+-h/i,
  /:>\s*\/etc\/passwd/i,
  /chmod\s+-R\s+777\s+\//i,
];

export class DestructiveActionError extends Error {
  constructor(matchedPattern) {
    super(`Blocked destructive action matching: ${matchedPattern}`);
    this.name = "DestructiveActionError";
    this.matchedPattern = String(matchedPattern);
  }
}

export function assertSafeText(text) {
  if (!text) return;
  for (const pattern of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(text)) {
      throw new DestructiveActionError(pattern);
    }
  }
}

// Builder agents may only ever write inside their run's sandbox directory.
// This resolves the target path and throws if it would escape the sandbox root.
export function assertPathWithinSandbox(sandboxRoot, targetPath) {
  const resolvedRoot = path.resolve(sandboxRoot);
  const resolvedTarget = path.resolve(sandboxRoot, targetPath);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new DestructiveActionError(`path traversal outside sandbox: ${targetPath}`);
  }
  return resolvedTarget;
}

export function requiresHumanApproval() {
  // Publishing to any production destination always stops for a human click-through.
  // This is intentionally not configurable from the UI.
  return true;
}

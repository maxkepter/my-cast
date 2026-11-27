---
name: santa-loop
description: Multi-agent adversarial verification framework. Requires two independent reviewers (auditor + security-reviewer) to both pass before changes ship, with an automated fix-and-re-review convergence loop.
---

# Santa Loop (Adversarial Dual-Review Verification)

The Santa Loop eliminates single-reviewer confirmation bias by requiring two independent reviewers, operating with zero shared conversational context, to evaluate deliverables against an identical strict rubric. Both reviewers must approve before code can merge or deploy.

## Core Principle

A single agent reviewing its own work shares the same assumptions, blind spots, and hallucination patterns that generated the code. Two isolated reviewers evaluate the diff independently:
- **Reviewer A (`auditor`)** checks plan adherence, NestJS DDD/module boundaries, contract compatibility, `DESIGN.md` compliance, and build/test regression safety.
- **Reviewer B (`security-reviewer`)** checks OWASP Top 10 security, auth/IDOR guards, secret hygiene, S3/FFmpeg safety, edge cases, and error recovery.

```text
[Implementation Diff]
        │
   ┌────┴────┐
   ▼         ▼
[Review A] [Review B]  (Isolated contexts, same rubric)
   │         │
   └────┬────┘
        ▼
   [Verdict Gate]
   Both PASS?
   ├── YES ──> [READY TO MERGE / SHIP]
   └── NO  ──> [FIX CYCLE] ──> Loop (Max 3 iterations before human escalation)
```

## Review Rubric

Both independent reviewers evaluate against five criteria:
1. **Contract Integrity**: Does the change strictly honor established public APIs, DTOs, module-only imports, and database schemas?
2. **Defensive Robustness**: Are null/undefined values, malformed inputs, timeouts, and resource leaks handled?
3. **Test Adequacy**: Are there automated tests verifying both the happy path and critical failure paths?
4. **Security & Secrets**: Are inputs sanitized, permissions checked, and secrets completely unexposed?
5. **No Regressions**: Do existing features, lint, build, and tests remain fully functional?

## Convergence Loop Protocol

1. Dispatch `auditor` (Reviewer A) and `security-reviewer` (Reviewer B) independently over the target diff.
2. Ingest structured verdicts:
   - If **Reviewer A = PASS** AND **Reviewer B = PASS**: Issue final approval.
   - If either reviewer issues findings:
     a. Consolidate findings into a deduplicated, actionable fix list.
     b. Dispatch `executor` (or `build-error-resolver` for build errors) to resolve the specific findings.
     c. Re-run both `auditor` and `security-reviewer` on the updated diff.
     d. Enforce a maximum cap of 3 iterations. If convergence is not achieved after 3 iterations, stop and escalate to the human operator with all accumulated findings.

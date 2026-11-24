---
name: systemone
description: Run typed semantic evaluation, classification, and quantitative scoring via SystemOne (noul, noun, string, number/score, list) directly via CLI flags or Node.js module without needing JSON payload files.
---

# SystemOne Evaluation Skill

Evaluate context and artifacts via CLI flags, Node.js API, or JSON/stdin input. Automatically loads local `.env` configuration and supports all 5 typed primitives.

## Environment Configuration

Configure credentials in your shell environment or a local `.env` file under `.claude/skills/systemone/.env` or `.claude/skills/systemone/script/.env` (never commit `.env`; see `script/.env.example`):

- `JEV_API_KEY` or `TYPESAFE_API_KEY` (required): API key for authentication.
- `JEV_ENDPOINT_URL` (optional): Custom endpoint URL (defaults to `http://localhost:8080/v1/systemone`).
- `JEV_MODEL` (optional): Target model identifier (defaults to `systemone-1.0`).

If no API key is configured, skip SystemOne evaluation and note it as skipped.

## Supported Primitives

1. **`noul`** (Boolean / probability `[0..1]`): Evaluates whether a condition holds.
2. **`noun` / `choice`** (Single-label classification): Selects one option from `options` with a probability distribution.
3. **`string`** (String extraction): Extracts a matching label or identifier from candidate options.
4. **`number` / `score`** (Quantitative scale):
   - `number`: Numeric scale (`min,max`).
   - `score`: Ordered descriptive levels.
5. **`list`** (Multi-label): Selects all applicable labels from `options`.

## CLI Usage

Script path: `.claude/skills/systemone/script/systemone-eval.js` (run with `--help` for full usage).

### Explicit Flags

```bash
node .claude/skills/systemone/script/systemone-eval.js \
  -s "Video streaming API timed out while uploading a 2GB video" \
  --noul is_urgent "Is this urgent?" \
  --noun category "Classify issue type" "bug,performance,billing" \
  --number priority "Priority level" "1,5" \
  --list tags "Affected areas" "backend,frontend,storage,devops" \
  --string target "Affected module" "video_upload,user_profile,auth"
```

### Compact `-q` Syntax

```bash
node .claude/skills/systemone/script/systemone-eval.js \
  -s "User reported spam video upload" \
  -q "is_valid:noul:Is the report valid?" \
  -q "action:noun:Recommended action:ban=Suspend account,warn=Issue warning,dismiss=Dismiss" \
  -q "severity:number:Severity level:1,5" \
  -q "tags:list:Violation categories:spam,harassment,hate_speech"
```

## Node.js Module Usage

```javascript
const { evaluate } = require("./.claude/skills/systemone/script/systemone-eval");

const res = await evaluate({
  state: { text: "Video streaming API" },
  questions: {
    is_core: { type: "noul", instructions: "Is this in the core domain?" },
    category: { type: "noun", instructions: "Category", options: ["video", "social", "auth"] },
    priority: { type: "number", instructions: "Priority", min: 1, max: 5 },
    tags: { type: "list", instructions: "Affected areas", options: ["backend", "frontend", "storage"] }
  }
});
```

## JSON File or Stdin Pipe

```bash
node .claude/skills/systemone/script/systemone-eval.js payload.json
```

## Reporting Standard

Whenever reporting a SystemOne evaluation in agent output, include:
1. **Evaluation Process**: Input state summary, configured primitives, and executed command/code.
2. **Results & Decisions**: Returned values/scores/probabilities and the concrete action chosen from them.

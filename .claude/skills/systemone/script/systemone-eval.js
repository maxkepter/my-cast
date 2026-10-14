#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

// Auto-load .env from script or skill directory if present
for (const p of [
  path.join(__dirname, ".env"),
  path.join(__dirname, "..", ".env"),
]) {
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed
          .slice(idx + 1)
          .trim()
          .replace(/^['"](.*)['"]$/, "$1");
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}

const ENDPOINT =
  process.env.JEV_ENDPOINT_URL || "https://router.kepter.id.vn/v1/systemone";
const API_KEY = process.env.JEV_API_KEY;
const MODEL = process.env.JEV_MODEL || "oc/jev-1.13-free";

/**
 * Adapter layer: Chuẩn hóa 5 kiểu câu hỏi (noul, noun, string, score/number, list)
 * về 3 primitives gốc của JEV Engine (noul, choice, score) và gom lại kết quả.
 */
function prepareQuestions(rawQuestions) {
  let qMap = {};
  if (Array.isArray(rawQuestions)) {
    for (const q of rawQuestions) {
      const { id, ...rest } = q;
      qMap[id || rest.name] = rest;
    }
  } else {
    qMap = { ...rawQuestions };
  }

  const outboundQuestions = {};
  const transforms = {};

  for (const [id, q] of Object.entries(qMap)) {
    const type = q.type || "noul";

    if (type === "noul") {
      outboundQuestions[id] = {
        type: "noul",
        instructions: q.instructions || q.instruction,
        criteria: q.criteria,
      };
      transforms[id] = { type: "noul" };
    } else if (type === "noun" || type === "choice") {
      let criteria = q.criteria;
      if (!criteria && Array.isArray(q.options)) {
        criteria = {};
        for (const opt of q.options) {
          criteria[opt] = opt;
        }
      } else if (typeof criteria === "string") {
        try {
          criteria = JSON.parse(criteria);
        } catch {
          const m = {};
          for (const item of criteria.split(",")) {
            const [k, ...v] = item.split("=");
            m[k.trim()] = v.length ? v.join("=").trim() : k.trim();
          }
          criteria = m;
        }
      }

      outboundQuestions[id] = {
        type: "choice",
        instructions: q.instructions || q.instruction,
        criteria: criteria || {},
      };
      transforms[id] = { type: type === "noun" ? "noun" : "choice" };
    } else if (type === "number") {
      const min = q.min ?? 1;
      const max = q.max ?? 5;
      const criteria = [];
      for (let i = min; i <= max; i++) {
        criteria.push(String(i));
      }
      outboundQuestions[id] = {
        type: "score",
        instructions: q.instructions || q.instruction,
        criteria,
      };
      transforms[id] = { type: "number", min, max };
    } else if (type === "score") {
      let criteria = q.criteria;
      if (typeof criteria === "string") {
        criteria = criteria.split(",").map((s) => s.trim());
      } else if (Array.isArray(q.options)) {
        criteria = q.options;
      }
      outboundQuestions[id] = {
        type: "score",
        instructions: q.instructions || q.instruction,
        criteria: criteria || [],
      };
      transforms[id] = { type: "score" };
    } else if (type === "list") {
      const options = q.options || (typeof q.criteria === "string" ? q.criteria.split(",") : []);
      transforms[id] = { type: "list", options };
      for (const opt of options) {
        const cleanOpt = opt.trim();
        const subId = `${id}__list__${cleanOpt}`;
        outboundQuestions[subId] = {
          type: "noul",
          instructions: `${q.instructions || q.instruction}. Áp dụng nhãn "${cleanOpt}"?`,
        };
      }
    } else if (type === "string") {
      // String extraction qua candidate choices
      let criteria = q.criteria || {};
      if (Array.isArray(q.options)) {
        criteria = {};
        for (const opt of q.options) {
          criteria[opt] = opt;
        }
      }
      outboundQuestions[id] = {
        type: "choice",
        instructions: q.instructions || q.instruction,
        criteria,
      };
      transforms[id] = { type: "string" };
    }
  }

  return { outboundQuestions, transforms };
}

function formatAnswers(rawAnswers, transforms) {
  const finalAnswers = {};

  for (const [id, t] of Object.entries(transforms)) {
    if (t.type === "noul") {
      finalAnswers[id] = rawAnswers[id];
    } else if (t.type === "noun") {
      const res = rawAnswers[id];
      finalAnswers[id] = {
        type: "noun",
        value: res?.choice,
        confidence: res?.confidence,
        probabilities: res?.probabilities,
      };
    } else if (t.type === "choice") {
      finalAnswers[id] = rawAnswers[id];
    } else if (t.type === "number") {
      const res = rawAnswers[id];
      finalAnswers[id] = {
        type: "number",
        value: res ? Number(res.score.toFixed(2)) : null,
        confidence: res?.confidence,
        raw_score: res?.score,
      };
    } else if (t.type === "score") {
      finalAnswers[id] = rawAnswers[id];
    } else if (t.type === "string") {
      const res = rawAnswers[id];
      finalAnswers[id] = {
        type: "string",
        value: res?.choice,
        confidence: res?.confidence,
      };
    } else if (t.type === "list") {
      const scores = {};
      const selected = [];
      for (const opt of t.options) {
        const cleanOpt = opt.trim();
        const subId = `${id}__list__${cleanOpt}`;
        const subRes = rawAnswers[subId];
        const prob = subRes?.noul ?? 0;
        scores[cleanOpt] = prob;
        if (prob >= 0.5) {
          selected.push(cleanOpt);
        }
      }
      finalAnswers[id] = {
        type: "list",
        selected,
        scores,
      };
    }
  }

  return finalAnswers;
}

async function evaluate({ state, questions, model }) {
  if (!API_KEY) {
    throw new Error("Thiếu biến môi trường JEV_API_KEY.");
  }

  const { outboundQuestions, transforms } = prepareQuestions(questions);

  const payload = {
    model: model || MODEL,
    state: typeof state === "string" ? { text: state } : state,
    questions: outboundQuestions,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return {
      model: data.model,
      answers: formatAnswers(data.answers || {}, transforms),
      usage: data.usage,
      cost: data.cost,
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

function parseCliArgs(args) {
  let state = null;
  let model = null;
  const questions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--state" || arg === "-s") {
      const val = args[++i];
      try {
        state = JSON.parse(val);
      } catch {
        state = { text: val };
      }
    } else if (arg === "--model" || arg === "-m") {
      model = args[++i];
    } else if (arg === "--noul") {
      const id = args[++i];
      const instructions = args[++i];
      questions[id] = { type: "noul", instructions };
    } else if (arg === "--noun") {
      const id = args[++i];
      const instructions = args[++i];
      const rawOptions = args[++i];
      questions[id] = {
        type: "noun",
        instructions,
        options: (rawOptions || "").split(",").map((s) => s.trim()),
      };
    } else if (arg === "--choice") {
      const id = args[++i];
      const instructions = args[++i];
      const rawCriteria = args[++i];
      let criteria = {};
      try {
        criteria = JSON.parse(rawCriteria);
      } catch {
        for (const item of (rawCriteria || "").split(",")) {
          const [k, ...v] = item.split("=");
          criteria[k.trim()] = v.length ? v.join("=").trim() : k.trim();
        }
      }
      questions[id] = { type: "choice", instructions, criteria };
    } else if (arg === "--score") {
      const id = args[++i];
      const instructions = args[++i];
      const rawCriteria = args[++i];
      questions[id] = {
        type: "score",
        instructions,
        criteria: (rawCriteria || "").split(",").map((s) => s.trim()),
      };
    } else if (arg === "--number") {
      const id = args[++i];
      const instructions = args[++i];
      const range = (args[++i] || "1,5").split(",");
      questions[id] = {
        type: "number",
        instructions,
        min: Number(range[0]) || 1,
        max: Number(range[1]) || 5,
      };
    } else if (arg === "--list") {
      const id = args[++i];
      const instructions = args[++i];
      const rawOptions = args[++i];
      questions[id] = {
        type: "list",
        instructions,
        options: (rawOptions || "").split(",").map((s) => s.trim()),
      };
    } else if (arg === "--string") {
      const id = args[++i];
      const instructions = args[++i];
      const rawOptions = args[++i];
      questions[id] = {
        type: "string",
        instructions,
        options: rawOptions ? rawOptions.split(",").map((s) => s.trim()) : [],
      };
    } else if (arg === "--q" || arg === "-q") {
      // Format: id:type:instructions:options_or_criteria
      const raw = args[++i];
      const [id, type, instructions, ...rest] = raw.split(":");
      const extra = rest.join(":");
      if (type === "noul") {
        questions[id] = { type: "noul", instructions };
      } else if (type === "noun") {
        questions[id] = {
          type: "noun",
          instructions,
          options: extra.split(",").map((s) => s.trim()),
        };
      } else if (type === "choice") {
        const criteria = {};
        for (const item of extra.split(",")) {
          const [k, ...v] = item.split("=");
          criteria[k.trim()] = v.length ? v.join("=").trim() : k.trim();
        }
        questions[id] = { type: "choice", instructions, criteria };
      } else if (type === "score") {
        questions[id] = {
          type: "score",
          instructions,
          criteria: extra.split(",").map((s) => s.trim()),
        };
      } else if (type === "number") {
        const [min, max] = extra.split(",");
        questions[id] = {
          type: "number",
          instructions,
          min: Number(min) || 1,
          max: Number(max) || 5,
        };
      } else if (type === "list") {
        questions[id] = {
          type: "list",
          instructions,
          options: extra.split(",").map((s) => s.trim()),
        };
      } else if (type === "string") {
        questions[id] = {
          type: "string",
          instructions,
          options: extra ? extra.split(",").map((s) => s.trim()) : [],
        };
      }
    }
  }

  return { state, questions, model };
}

async function main() {
  const argv = process.argv.slice(2);

  // Mode 1: CLI Flags
  const hasFlags = argv.some((a) => a.startsWith("-"));
  if (hasFlags) {
    const { state, questions, model } = parseCliArgs(argv);
    if (Object.keys(questions).length === 0) {
      console.error(
        JSON.stringify({ error: "Không tìm thấy câu hỏi nào qua CLI flags." }),
      );
      process.exit(1);
    }
    try {
      const res = await evaluate({ state: state || {}, questions, model });
      console.log(JSON.stringify(res, null, 2));
      return;
    } catch (err) {
      console.error(JSON.stringify({ error: err.message }));
      process.exit(1);
    }
  }

  // Mode 2: File path, JSON string, or Stdin pipe
  let rawInput = argv[0];
  if (rawInput && fs.existsSync(rawInput)) {
    try {
      rawInput = fs.readFileSync(rawInput, "utf-8");
    } catch (_) {}
  } else if (!rawInput) {
    try {
      rawInput = fs.readFileSync(0, "utf-8");
    } catch (_) {}
  }

  if (!rawInput) {
    console.error(
      JSON.stringify({
        error:
          "Thiếu input. Dùng CLI flags (--noul, --noun, --string, --score, --number, --list) hoặc truyền JSON/file.",
      }),
    );
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(rawInput);
  } catch (e) {
    console.error(
      JSON.stringify({
        error: "Input không phải JSON hợp lệ",
        details: e.message,
      }),
    );
    process.exit(1);
  }

  try {
    const res = await evaluate({
      state: parsed.state,
      questions: parsed.questions,
      model: parsed.model,
    });
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { evaluate };

#!/usr/bin/env node
const fs = require("fs");

const ENDPOINT = process.env.JEV_ENDPOINT_URL || "localhost:8080/v1/jev-eval";
const API_KEY = process.env.JEV_API_KEY;
const MODEL = process.env.JEV_MODEL || "jev-1.13";

if (!API_KEY) {
  console.error(
    JSON.stringify({ error: "Thiếu biến môi trường JEV_API_KEY." }),
  );
  process.exit(1);
}

async function main() {
  let rawInput = process.argv[2];
  if (!rawInput) {
    try {
      rawInput = fs.readFileSync(0, "utf-8");
    } catch (_) {}
  }

  if (!rawInput) {
    console.error(JSON.stringify({ error: "Thiếu payload JSON input." }));
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

  const payload = {
    model: parsed.model || MODEL,
    state: parsed.state,
    questions: parsed.questions,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

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
      console.error(
        JSON.stringify({ error: `HTTP ${res.status}`, details: errText }),
      );
      process.exit(1);
    }

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    clearTimeout(timeout);
    console.error(
      JSON.stringify({ error: "Network/Timeout error", details: err.message }),
    );
    process.exit(1);
  }
}

main();

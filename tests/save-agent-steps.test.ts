import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { submitTask } from "../src/lib/api.ts";
import {
  deriveAgentStepsFromHarEntries,
  normalizePromptAndOptions,
} from "../src/commands/save.ts";

type FetchCall = {
  url: string;
  init: RequestInit;
};

const originalFetch = globalThis.fetch;
const originalApiUrl = process.env.GRABBIT_API_URL;

const fetchCalls: FetchCall[] = [];

function installFetchStub() {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    fetchCalls.push({ url, init: init ?? {} });
    return new Response(JSON.stringify({ taskId: "task_123", status: "pending" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

afterEach(() => {
  fetchCalls.length = 0;
  globalThis.fetch = originalFetch;
  if (originalApiUrl === undefined) {
    delete process.env.GRABBIT_API_URL;
  } else {
    process.env.GRABBIT_API_URL = originalApiUrl;
  }
});

test("submitTask includes agentSteps in JSON payload", async () => {
  process.env.GRABBIT_API_URL = "https://example.test";
  installFetchStub();

  await submitTask("har-content", "make a workflow", "gpt-test", {
    transport: "json",
    agentSteps: ["GET api.example.com/products", "POST api.example.com/cart"],
  });

  assert.equal(fetchCalls.length, 1);
  const call = fetchCalls[0];
  assert.equal(call.url, "https://example.test/api/cli/tasks");
  const body = JSON.parse(String(call.init.body));
  assert.deepEqual(body.agentSteps, [
    "GET api.example.com/products",
    "POST api.example.com/cart",
  ]);
});

test("submitTask includes agentSteps as JSON string in multipart payload", async () => {
  process.env.GRABBIT_API_URL = "https://example.test";
  installFetchStub();

  await submitTask(new Uint8Array([1, 2, 3]), "make a workflow", "gpt-test", {
    transport: "multipart",
    compression: "gzip",
    agentSteps: ["GET app.example.com/", "POST app.example.com/login"],
  });

  assert.equal(fetchCalls.length, 1);
  const body = fetchCalls[0].init.body;
  assert.ok(body instanceof FormData);
  assert.equal(
    body.get("agentSteps"),
    JSON.stringify(["GET app.example.com/", "POST app.example.com/login"])
  );
});

test("normalizePromptAndOptions extracts repeated --step and strips flags from prompt", () => {
  const parsed = normalizePromptAndOptions(
    [
      "build",
      "checkout",
      "workflow",
      "--step",
      "open homepage",
      "--step",
      "submit order",
      "--model",
      "gpt-4.1",
    ],
    {}
  );

  assert.equal(parsed.prompt, "build checkout workflow");
  assert.equal(parsed.model, "gpt-4.1");
  assert.deepEqual(parsed.agentSteps, ["open homepage", "submit order"]);
});

test("normalizePromptAndOptions includes explicit option steps", () => {
  const parsed = normalizePromptAndOptions(["build", "checkout", "workflow"], {
    step: ["capture login", "extract invoice"],
  });
  assert.equal(parsed.prompt, "build checkout workflow");
  assert.deepEqual(parsed.agentSteps, ["capture login", "extract invoice"]);
});

test("deriveAgentStepsFromHarEntries is deterministic and bounded", () => {
  const entries = Array.from({ length: 25 }).map((_, idx) => ({
    request: {
      method: idx % 2 === 0 ? "get" : "post",
      url: `https://api.example.com/path/${idx}?q=1`,
    },
  }));

  const steps = deriveAgentStepsFromHarEntries(entries);

  assert.equal(steps.length, 20);
  assert.equal(steps[0], "GET api.example.com/path/0");
  assert.equal(steps[1], "POST api.example.com/path/1");
  assert.equal(steps[19], "POST api.example.com/path/19");
});

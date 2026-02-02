import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { gzipSync } from "zlib";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { clearSession, getConfig, getSession } from "../lib/config.js";
import { submitTask } from "../lib/api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function getGrabbitBrowsePath(): string {
  // 1. Try to find the package using Node's resolution logic (for production/npm)
  try {
    return require.resolve("@cole-labs/grabbit-browser/bin/grabbit-browse.js");
  } catch (e) {
    // Ignore error and try other paths
  }

  // 2. Try development path (monorepo structure)
  const devPath = path.resolve(__dirname, "../../browser/bin/grabbit-browse.js");
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  // 3. Fallback to a relative path that might work in some global install structures
  const fallbackPath = path.resolve(__dirname, "../../node_modules/@cole-labs/grabbit-browser/bin/grabbit-browse.js");
  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }

  console.error("Error: Could not find @cole-labs/grabbit-browser package.");
  console.error("Please ensure it is installed correctly.");
  process.exit(1);
}

function normalizePromptAndOptions(
  promptParts: string[],
  options: { model?: string; session?: string }
): { prompt: string; session?: string; model?: string } {
  const parts = [...promptParts];
  let session = options.session;
  let model = options.model;

  for (let i = 0; i < parts.length; i++) {
    const token = parts[i];
    if ((token === "--session" || token === "-s") && parts[i + 1]) {
      session = parts[i + 1];
      parts.splice(i, 2);
      i -= 1;
      continue;
    }
    if ((token === "--model" || token === "-m") && parts[i + 1]) {
      model = parts[i + 1];
      parts.splice(i, 2);
      i -= 1;
    }
  }

  return { prompt: parts.join(" ").trim(), session, model };
}

export default async function save(
  promptParts: string[],
  options: { model?: string; session?: string }
): Promise<void> {
  const { prompt, session, model } = normalizePromptAndOptions(promptParts, options);
  const config = getConfig();
  const currentSession = getSession();
  const sessionName = session ?? currentSession?.sessionName;

  if (!config?.token) {
    console.error("Error: Not authenticated");
    console.error("Run 'grabbit auth' to authenticate first.");
    process.exit(1);
  }

  if (!prompt) {
    console.error("Error: Missing prompt");
    console.error("Usage: grabbit save --session <name> \"Describe the workflow\"");
    process.exit(1);
  }

  console.log("Exporting HAR from browser session...");

  // Get HAR from browser session
  if (!sessionName) {
    console.error("Error: No active browser session");
    console.error("Start one with: grabbit browse --session <name> open <url>");
    process.exit(1);
  }

  const har = await exportHarFromBrowser(sessionName);

  if (!har) {
    console.error("Error: Failed to export HAR");
    console.error("Make sure you have an active browser session with recorded requests.");
    process.exit(1);
  }

  // Parse HAR to check entry count and filter large/unnecessary content
  let filteredHar = har;
  try {
    const harData = JSON.parse(har);
    const entries = harData.log?.entries ?? [];
    const entryCount = entries.length;
    console.log(`Captured ${entryCount} request(s)`);

    if (entryCount === 0) {
      console.error("Error: No requests recorded");
      console.error("Navigate to a page and interact with it before saving.");
      process.exit(1);
    }

    // Strip binary responses (images/fonts/media) but keep full text/json bodies
    // to preserve API context for the agent.
    let filteredCount = 0;
    
    harData.log.entries = entries.map((entry: any) => {
      const mimeType = entry.response?.content?.mimeType || "";
      const isText =
        mimeType.includes("json") ||
        mimeType.includes("text") ||
        mimeType.includes("javascript") ||
        mimeType.includes("xml");
      
      if (!isText) {
        if (entry.response?.content?.text) {
          entry.response.content.text = "(Body removed: binary response)";
          filteredCount++;
        }
      }
      return entry;
    });

    if (filteredCount > 0) {
      console.log(`Optimized HAR: Stripped ${filteredCount} binary response bodies`);
    }
    filteredHar = JSON.stringify(harData);
  } catch {
    console.error("Error: Invalid HAR data");
    process.exit(1);
  }

  console.log("Submitting task...");

  // Compress HAR to avoid payload size limits
  console.log("Compressing capture data...");
  const compressedHar = gzipSync(filteredHar);
  const originalSizeMb = (filteredHar.length / 1024 / 1024).toFixed(2);
  const compressedSizeMb = (compressedHar.byteLength / 1024 / 1024).toFixed(2);
  console.log(`Size: ${originalSizeMb} MB -> ${compressedSizeMb} MB`);

  try {
    const result = await submitTask(compressedHar, prompt, model, {
      compression: "gzip",
      transport: "multipart",
    });

    console.log(`\nTask submitted: ${result.taskId}`);
    console.log(`Status: ${result.status}`);
    console.log(`\nCheck progress with: grabbit check ${result.taskId}`);

    // Clear session state
    await closeBrowserSession(sessionName);
    clearSession();
  } catch (error) {
    console.error(
      "Failed to submit task:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

async function exportHarFromBrowser(sessionName: string): Promise<string | null> {
  const browsePath = getGrabbitBrowsePath();

  return new Promise((resolve) => {
    const child = spawn(
      "node",
      [browsePath, "--session", sessionName, "har", "export", "--json"],
      {
      stdio: ["inherit", "pipe", "inherit"],
      env: process.env,
      }
    );

    let stdout = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.on("error", (err) => {
      console.error(`Error executing grabbit-browse: ${err.message}`);
      resolve(null);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        resolve(null);
        return;
      }

      // Parse the JSON output to get the HAR
      try {
        const result = JSON.parse(stdout);
        if (result.success && result.data?.har) {
          resolve(result.data.har);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    });
  });
}

async function closeBrowserSession(sessionName: string): Promise<void> {
  const browsePath = getGrabbitBrowsePath();
  await new Promise<void>((resolve) => {
    const child = spawn("node", [browsePath, "--session", sessionName, "close"], {
      stdio: "ignore",
      env: process.env,
    });
    child.on("close", () => resolve());
    child.on("error", () => resolve());
  });
}

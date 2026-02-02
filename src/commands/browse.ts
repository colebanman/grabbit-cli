import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { clearSession, getSession, saveSession } from "../lib/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Path to grabbit-browse binary/script
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

function splitFlags(args: string[]): { flagArgs: string[]; commandIndex: number } {
  const flagArgs: string[] = [];
  const flagsWithValue = new Set([
    "--session",
    "--profile",
    "--state",
    "--headers",
    "--executable-path",
    "--extension",
    "--args",
    "--user-agent",
    "--proxy",
    "--proxy-bypass",
    "--cdp",
    "--provider",
    "-p",
  ]);

  let commandIndex = -1;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("-")) {
      flagArgs.push(arg);
      if (flagsWithValue.has(arg) && i + 1 < args.length) {
        flagArgs.push(args[i + 1]);
        i += 1;
      }
      continue;
    }
    commandIndex = i;
    break;
  }

  if (commandIndex === -1) {
    commandIndex = 0;
  }

  return { flagArgs, commandIndex };
}

function getFlagValue(flagArgs: string[], flag: string): string | undefined {
  const idx = flagArgs.indexOf(flag);
  if (idx === -1) return undefined;
  return flagArgs[idx + 1];
}

function looksLikeUrl(value: string | undefined): boolean {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://");
}

export default async function browse(args: string[]): Promise<void> {
  const browsePath = getGrabbitBrowsePath();
  const { flagArgs, commandIndex } = splitFlags(args);
  const commandArgs = args.slice(commandIndex);
  const command = commandArgs[0];
  
  // Check if user provided a session name
  const providedSession = getFlagValue(flagArgs, "--session");
  const hasExplicitSession = !!providedSession;
  
  // Generate session name: use provided, or create unique temp session
  const sessionName = providedSession || `temp-${Date.now()}`;
  
  // Build effective args with session
  const effectiveFlagArgs = hasExplicitSession 
    ? flagArgs 
    : ["--session", sessionName, ...flagArgs];
  const effectiveArgs = [...effectiveFlagArgs, ...commandArgs];

  // Check if this is a navigation command
  const isNavigation =
    command === "open" ||
    command === "navigate" ||
    (commandIndex === 0 && looksLikeUrl(command));

  // RULE: No explicit session = close any existing default/temp session first
  if (!hasExplicitSession && isNavigation) {
    // Close any existing default session to ensure clean state
    await runBrowseCommand(browsePath, ["--session", "default", "close"]);
    // Also try to close the temp session we're about to use (in case it exists)
    await runBrowseCommand(browsePath, ["--session", sessionName, "close"]);
    // Wait for daemon to fully shut down (it has 100ms delay)
    await new Promise(r => setTimeout(r, 200));
  }

  // For navigation commands: start HAR recording
  if (isNavigation) {
    // Run the navigation command first (launches browser)
    let exitCode = await runBrowseCommand(browsePath, effectiveArgs);

    // Start HAR recording after browser is launched
    if (exitCode === 0) {
      console.log("Starting HAR recording...");
      const harStarted = (await runBrowseCommand(browsePath, [...effectiveFlagArgs, "har", "start"])) === 0;
      
      if (harStarted) {
        saveSession({ harRecording: true, startedAt: new Date().toISOString(), sessionName });
        
        // Reload to capture initial page load in HAR
        console.log("Reloading to capture traffic...");
        exitCode = await runBrowseCommand(browsePath, [...effectiveFlagArgs, "reload"]);
      }
    }

    process.exit(exitCode);
  }

  // Non-navigation commands: just run them
  const exitCode = await runBrowseCommand(browsePath, effectiveArgs);

  // Handle close command
  if (command === "close") {
    clearSession();
  }

  process.exit(exitCode);
}

function runBrowseCommand(
  browsePath: string,
  args: string[]
): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn("node", [browsePath, ...args], {
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", (err) => {
      console.error(`Error executing grabbit-browse: ${err.message}`);
      resolve(1);
    });

    child.on("close", (code) => {
      resolve(code ?? 0);
    });
  });
}

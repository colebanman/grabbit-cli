import { createRequire } from "module";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function getGrabbitBrowsePath() {
  try {
    return require.resolve("@cole-labs/grabbit-browser/bin/grabbit-browse.js");
  } catch (e) {
    console.log("require.resolve failed");
  }

  const devPath = path.resolve(__dirname, "../../browser/bin/grabbit-browse.js");
  console.log("Checking devPath:", devPath);
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  const fallbackPath = path.resolve(__dirname, "../../node_modules/@cole-labs/grabbit-browser/bin/grabbit-browse.js");
  console.log("Checking fallbackPath:", fallbackPath);
  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }

  return "NOT FOUND";
}

console.log("Resolved Path:", getGrabbitBrowsePath());

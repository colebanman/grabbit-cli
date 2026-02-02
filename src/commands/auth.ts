import open from "open";
import readline from "readline";
import { saveConfig } from "../lib/config.js";
import { exchangeCode } from "../lib/api.js";

export default async function auth(): Promise<void> {
  // Always default to production or explicit ENV for fresh auth
  // Do not use getApiUrl() here as it might return a stale localhost URL from config
  const envUrl = process.env.GRABBIT_API_URL;
  const apiUrl = envUrl ? envUrl.replace(/\/+$/, "") : "https://www.grabbit.dev";
  const pairingUrl = `${apiUrl}/cli/auth`;

  console.log("Opening browser for authentication...");
  console.log(`If browser doesn't open, visit: ${pairingUrl}\n`);

  // Open browser
  await open(pairingUrl);

  // Prompt for pairing code
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise<string>((resolve) => {
    rl.question("Enter the pairing code shown in your browser: ", (answer) => {
      rl.close();
      resolve(answer.trim().toUpperCase());
    });
  });

  if (!code) {
    console.error("Error: No code provided");
    process.exit(1);
  }

  console.log("\nExchanging code for token...");

  try {
    const result = await exchangeCode(code, apiUrl);

    // Save config
    saveConfig({
      token: result.token,
      apiUrl,
      userId: result.userId,
    });

    console.log("Successfully authenticated!");
    console.log(`User ID: ${result.userId}`);
    console.log(`Token saved to ~/.grabbit/config.json`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("waitlist")) {
      console.error("Authentication blocked: your account is waitlisted.");
      console.error("Check the waitlist page or contact support.");
      process.exit(1);
    }
    console.error(
      "Authentication failed:",
      message
    );
    process.exit(1);
  }
}

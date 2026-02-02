import { apiRequest } from "../lib/api.js";
import { getConfig } from "../lib/config.js";

interface Token {
  id: string;
  name: string;
  token: string;
  rate_limit: number;
  is_default: boolean;
  created_at: string;
  last_used_at: string | null;
}

export async function listKeys(): Promise<void> {
  const config = getConfig();
  if (!config?.token) {
    console.error("Error: Not authenticated. Run 'grabbit auth' first.");
    process.exit(1);
  }

  try {
    const tokens = await apiRequest<Token[]>("/api/cli/tokens");
    
    if (tokens.length === 0) {
      console.log("No API keys found.");
      return;
    }

    console.log("\nYour API Keys:");
    console.log("".padEnd(60, "-"));
    tokens.forEach(t => {
      const isDefault = t.is_default ? " (DEFAULT)" : "";
      const maskedToken = t.token.replace(/(.{8}).*(.{4})/, "$1...$2");
      console.log(`${t.name.padEnd(20)} ${maskedToken.padEnd(25)} Limit: ${t.rate_limit}/min${isDefault}`);
    });
    console.log("".padEnd(60, "-"));
    console.log("\nUse 'grabbit keys create <name>' to generate a new key.");
  } catch (error) {
    console.error("Error fetching keys:", error instanceof Error ? error.message : error);
  }
}

export async function createKey(name: string): Promise<void> {
  const config = getConfig();
  if (!config?.token) {
    console.error("Error: Not authenticated. Run 'grabbit auth' first.");
    process.exit(1);
  }

  try {
    const newToken = await apiRequest<Token>("/api/cli/tokens", {
      method: "POST",
      body: JSON.stringify({ name })
    });

    console.log("\nAPI Key Created Successfully!");
    console.log("".padEnd(40, "-"));
    console.log(`Name:  ${newToken.name}`);
    console.log(`Token: ${newToken.token}`);
    console.log("".padEnd(40, "-"));
    console.log("IMPORTANT: This token will only be shown once. Save it securely.");
  } catch (error) {
    console.error("Error creating key:", error instanceof Error ? error.message : error);
  }
}

export async function showKey(): Promise<void> {
  const config = getConfig();
  if (!config?.token) {
    console.error("Error: Not authenticated. Run 'grabbit auth' first.");
    process.exit(1);
  }

  console.log("\nCurrent API Key (from local config):");
  console.log("".padEnd(40, "-"));
  console.log(config.token);
  console.log("".padEnd(40, "-"));
  console.log("Tip: Set GRABBIT_API_KEY in your env manager.");
}

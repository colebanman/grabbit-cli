import os from "os";
import path from "path";
import fs from "fs";

const CONFIG_DIR = path.join(os.homedir(), ".grabbit");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
const SESSION_PATH = path.join(CONFIG_DIR, "session.json");

export interface Config {
  token: string;
  apiUrl: string;
  userId?: string;
}

export interface Session {
  harRecording: boolean;
  startedAt?: string;
  sessionName?: string;
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getConfig(): Config | null {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return null;
  }
}

export function saveConfig(config: Config): void {
  // Normalize apiUrl (remove trailing slash)
  if (config.apiUrl) {
    config.apiUrl = config.apiUrl.replace(/\/+$/, "");
  }
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function clearConfig(): void {
  if (fs.existsSync(CONFIG_PATH)) {
    fs.unlinkSync(CONFIG_PATH);
  }
}

export function getApiUrl(): string {
  // Priority: GRABBIT_API_URL env var > config file > default
  const envUrl = process.env.GRABBIT_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  const config = getConfig();
  if (config?.apiUrl) {
    return config.apiUrl.replace(/\/+$/, "");
  }

  return "https://www.grabbit.dev";
}

export function getSession(): Session | null {
  if (!fs.existsSync(SESSION_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(SESSION_PATH, "utf-8"));
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
}

export function clearSession(): void {
  if (fs.existsSync(SESSION_PATH)) {
    fs.unlinkSync(SESSION_PATH);
  }
}

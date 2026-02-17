import { spawn } from "child_process";
import path from "path";

const SKILL_REPO = "https://github.com/colebanman/grabbit-cli";

export default async function installSkill(): Promise<void> {
  const cwd = process.env.INIT_CWD || process.cwd();
  const displayDir = path.relative(process.cwd(), cwd) || ".";

  console.log(`Installing Grabbit skill in ${displayDir}...`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      "npx",
      ["skills", "add", SKILL_REPO, "--skill", "grabbit"],
      {
        cwd,
        stdio: "inherit",
        env: process.env,
      }
    );

    child.on("error", (err) => reject(err));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });
  }).catch((error) => {
    console.error(
      "Failed to install skill:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  });
}

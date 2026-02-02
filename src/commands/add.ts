import fs from "fs";
import path from "path";
import { getConfig, getApiUrl } from "../lib/config.js";
import { validateToken } from "../lib/api.js";

export default async function add(workflowId: string): Promise<void> {
  if (!workflowId) {
    console.error("Error: Workflow ID is required");
    console.log("Usage: grabbit add <workflow-id>");
    process.exit(1);
  }

  const config = getConfig();
  if (!config?.token) {
    console.error("Error: Not authenticated");
    console.log("Run 'grabbit auth' to authenticate first");
    process.exit(1);
  }

  const validation = await validateToken();
  if (!validation.valid) {
    const errorMessage = validation.error || "Unknown error";
    if (errorMessage.toLowerCase().includes("waitlist")) {
      console.error("Error: Account is waitlisted");
      console.log("Check the waitlist page or contact support.");
      process.exit(1);
    }
    console.error("Error: Authentication expired or invalid");
    console.log("Run 'grabbit auth' to re-authenticate");
    process.exit(1);
  }

  const apiUrl = getApiUrl();
  const skillUrl = `${apiUrl}/api/workflows/${workflowId}/skill.md`;

  console.log(`Fetching skill for workflow ${workflowId}...`);

  try {
    const response = await fetch(skillUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch skill: ${response.status}`);
    }

    const skillMd = await response.text();
    
    // Parse metadata from frontmatter
    const nameMatch = skillMd.match(/^name:\s*(.+)$/m);
    const descriptionMatch = skillMd.match(/^description:\s*(.+)$/m);
    
    const skillName = nameMatch ? nameMatch[1].trim() : `workflow-${workflowId}`;
    const skillTitle = skillName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    let description = descriptionMatch ? descriptionMatch[1].trim() : "";
    
    // Remove surrounding quotes if present
    if (description.startsWith('"') && description.endsWith('"')) {
      description = description.slice(1, -1);
    } else if (description.startsWith("'") && description.endsWith("'")) {
      description = description.slice(1, -1);
    }

    const cwd = process.env.INIT_CWD || process.cwd();
    const targetDir = path.join(cwd, ".agents", "skills", skillName);

    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, "SKILL.md"), skillMd);

    console.log(`Skill installed successfully.`);
    console.log(`Location: ${path.resolve(targetDir)}`);
    console.log(`File: SKILL.md`);
    console.log();
    console.log(`Skill: ${skillTitle}`);
    if (description) {
      console.log(`Description: ${description}`);
    }
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : "Failed to install skill"
    );
    process.exit(1);
  }
}

import { listWorkflows } from "../lib/api.js";
import { getConfig } from "../lib/config.js";

export default async function workflowsList(): Promise<void> {
  const config = getConfig();
  if (!config?.token) {
    console.error("Error: Not authenticated. Run 'grabbit auth' first.");
    process.exit(1);
  }

  try {
    const workflows = await listWorkflows();
    if (workflows.length === 0) {
      console.log("No workflows found.");
      return;
    }

    console.log("\nSaved Workflows:");
    console.log("".padEnd(80, "-"));
    workflows.forEach((w) => {
      const title = w.title || "Untitled";
      const description = w.description || "-";
      console.log(`${title}`);
      console.log(`  id: ${w.id}`);
      console.log(`  description: ${description}`);
      console.log("");
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("waitlist")) {
      console.error("Error: Account is waitlisted");
      console.error("Check the waitlist page or contact support.");
      process.exit(1);
    }
    console.error("Error fetching workflows:", message);
    process.exit(1);
  }
}

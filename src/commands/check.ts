import { getConfig } from "../lib/config.js";
import { checkTask, type TaskStatus } from "../lib/api.js";

export default async function check(taskId: string): Promise<void> {
  const config = getConfig();

  if (!config?.token) {
    console.error("Error: Not authenticated");
    console.error("Run 'grabbit auth' to authenticate first.");
    process.exit(1);
  }

  try {
    const status = await checkTask(taskId);
    printStatus(status);
  } catch (error) {
    console.error(
      "Failed to check task:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

function printStatus(status: TaskStatus): void {
  if (status.status !== "completed") {
    console.log(`Status: ${status.status}`);
  }

  switch (status.status) {
    case "pending":
      console.log("Task is queued and waiting to be processed.");
      break;

    case "processing":
      console.log("Task is being processed...");
      break;

    case "completed":
      if (status.inputs && status.inputs.length > 0) {
        console.log("--- Inputs ---");
        for (const input of status.inputs) {
          const defaultVal =
            input.default !== undefined ? ` (default: ${input.default})` : "";
          console.log(`  ${input.name}: ${input.type}${defaultVal}`);
          if (input.description) {
            console.log(`    ${input.description}`);
          }
        }
      }

      if (status.outputs && status.outputs.length > 0) {
        console.log("\n--- Outputs ---");
        for (const output of status.outputs) {
          console.log(`  ${output.name}: ${output.type}`);
          if (output.description) {
            console.log(`    ${output.description}`);
          }
        }
      }

      if (status.curl) {
        console.log("\n--- cURL ---");
        console.log(status.curl);
      }

      if (status.skillMd) {
        console.log("\n--- Instructions ---");
        console.log(status.skillMd);
      }

      if (status.addCommand) {
        console.log("\n--- Add as Skill ---");
        console.log(`Run this command to add this workflow as a local skill:`);
        console.log(`  ${status.addCommand}`);
      }
      break;

    case "error":
      console.log("Task failed with error:");
      console.log(status.error || "Unknown error");
      break;
  }
}

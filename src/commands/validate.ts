import { getConfig } from "../lib/config.js";
import { validateToken } from "../lib/api.js";

export default async function validate(): Promise<void> {
  const config = getConfig();

  if (!config?.token) {
    console.log("Status: Not authenticated");
    console.log("\nRun 'grabbit auth' to authenticate.");
    process.exit(1);
  }

  console.log("Validating token...");

  const result = await validateToken();

  if (result.valid) {
    console.log("Status: Authenticated");
    console.log(`User ID: ${result.userId}`);
  } else {
    const errorMessage = result.error || "Unknown error";
    if (errorMessage.toLowerCase().includes("waitlist")) {
      console.log("Status: Waitlisted");
      console.log("Your account is not yet approved.");
      console.log("Check the waitlist page or contact support.");
      process.exit(1);
    }

    console.log("Status: Invalid or expired token");
    console.log(`Error: ${errorMessage}`);
    console.log("\nRun 'grabbit auth' to re-authenticate.");
    process.exit(1);
  }
}

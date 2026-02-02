import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function skill(): Promise<void> {
  const cwd = process.env.INIT_CWD || process.cwd();
  const targetDir = path.join(cwd, ".agents", "skills", "grabbit");

  // Source skill from the package
  const sourceSkillPath = path.resolve(__dirname, "../../skill/SKILL.md");

  // Check if source skill exists
  if (!fs.existsSync(sourceSkillPath)) {
    // Fallback: create skill inline if not found
    console.log("Creating Grabbit skill...");
    createSkillInline(targetDir);
    return;
  }

  // Create target directory
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy skill file
  fs.copyFileSync(sourceSkillPath, path.join(targetDir, "SKILL.md"));

  console.log(`Grabbit skill installed to ${path.relative(cwd, targetDir)}/`);
}

function createSkillInline(targetDir: string): void {
  const skillContent = `---
name: grabbit
description: |
  Convert browser interactions into reusable API workflows. Use when the user
  wants to automate API calls, scrape data, create cURL commands from browser
  activity, or convert HAR captures into deterministic workflows. Triggers on:
  "create workflow", "automate API", "convert to curl", "record browser",
  "grabbit", "scrape", "extract data from website".
---

# Grabbit CLI

Convert browser interactions into deterministic API workflows.

## Prerequisites

Check authentication before starting:
\`\`\`bash
grabbit validate
\`\`\`

If not authenticated, instruct user to run:
\`\`\`bash
grabbit auth
\`\`\`

## Workflow

### 1. Browse to Find Data

Start browser and navigate to target:
\`\`\`bash
grabbit browse open https://example.com/api
grabbit browse snapshot  # View page structure
\`\`\`

Interact with the page:
\`\`\`bash
grabbit browse click "@e3"     # Click element
grabbit browse fill "@e5" "query"  # Fill input
grabbit browse snapshot        # View updated state
\`\`\`

### 2. Submit for Conversion

When target data is found/action complete:
\`\`\`bash
grabbit save "Extract product prices from the API. Example output: { price: 29.99, name: 'Widget' }"
\`\`\`

**Prompt Best Practices:**
- Be verbose with examples
- Include sample input/output data
- For static data: "Extract X, e.g., 'Example Value'"
- For interactive flows: describe each step with example data

### 3. Poll for Completion

\`\`\`bash
grabbit check <task-id>
\`\`\`

Poll every 5 seconds until status is \`completed\` or \`error\`.

### 4. Use the Result

Completed tasks return:
- Input parameters with defaults
- cURL command for API usage
- Response format specification

## Example Session

\`\`\`bash
# Authenticate (one-time)
grabbit auth

# Find stock price API
grabbit browse open https://finance.yahoo.com/quote/AAPL
grabbit browse snapshot

# Submit with verbose prompt
grabbit save "Get stock price for any ticker symbol. Example: AAPL returns { price: 198.45, change: +2.31, name: 'Apple Inc' }"

# Poll for result
grabbit check abc-123-def
# Returns workflow when complete
\`\`\`

## Commands Reference

| Command | Description |
|---------|-------------|
| \`grabbit auth\` | Authenticate with Grabbit |
| \`grabbit validate\` | Check authentication status |
| \`grabbit browse <cmd>\` | Browser automation (open, click, fill, snapshot, etc.) |
| \`grabbit save "<prompt>"\` | Submit current session for workflow generation |
| \`grabbit check <id>\` | Poll task status |
| \`grabbit skill\` | Install this skill locally |
`;

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, "SKILL.md"), skillContent);

  const cwd = process.env.INIT_CWD || process.cwd();
  console.log(`Grabbit skill installed to ${path.relative(cwd, targetDir)}/`);
}

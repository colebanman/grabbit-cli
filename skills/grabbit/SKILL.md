---
name: grabbit
description: "Control the Grabbit CLI to record browser interactions (HAR) and generate API workflows. Use when the user wants to: (1) Automate browser actions, (2) Capture web traffic for API analysis, (3) Create deterministic workflows from browsing sessions, or (4) Learn how to use the Grabbit CLI commands."
---

# Grabbit CLI

Master the Grabbit CLI to convert browser interactions into stable API workflows.

## Core Workflow

1.  **Authenticate**: Ensure you are logged in.
    ```bash
    grabbit validate || grabbit auth
    ```

2.  **Capture (Session)**: Always use `--session <name>` for isolation.
    ```bash
    # 1. Start session & Open URL
    grabbit browse --headed --session <name> open <url>

    # 2. Inspect & Interact
    grabbit browse --session <name> snapshot      # Get @e# refs
    grabbit browse --session <name> click @e1     # Click ref
    grabbit browse --session <name> fill @e2 "data"

    # 3. Verify
    grabbit browse --session <name> screenshot
    ```

3.  **Generate**: Submit the capture with a **verbose, example-rich prompt**.
    ```bash
    grabbit save --session <name> "Detailed description. Example Input: 'X'. Example Output: { id: '123' }"
    ```

4.  **Poll**: Wait for the result.
    ```bash
    grabbit check <task-id>
    ```

5.  **Integrate**: Install the workflow as a local skill or use API keys for cURL.
    ```bash
    grabbit add <workflow-id>
    grabbit skill install
    grabbit keys list
    grabbit keys show
    ```
    Set the API key for tools/agents: `export GRABBIT_API_KEY="<your-key>"`

6.  **List Workflows**: Find saved workflows.
    ```bash
    grabbit workflows
    ```

## Critical Best Practices

*   **Headed Mode**: Use `--headed` for sites with bot protection (Cloudflare, 403s) or when visual debugging is needed.
*   **Snapshots**: Run `snapshot` frequently to get stable `@e#` references (e.g., `@e4`) instead of fragile CSS selectors.
*   **API Keys**: Use `grabbit keys` to manage tokens for production integrations.
*   **Prompting**: The backend agent needs **concrete examples** (strings seen on page, JSON shapes) to map HAR requests to workflow steps.
    *   *Bad*: "Get prices."
    *   *Good*: "Extract prices. Example: '$19.99'. Output: { price: number }."

## Common Errors

*   **Unauthorized**: Run `grabbit auth`, then retry.
*   **No active browser session**: Start with `grabbit browse --session <name> open <url>` before `grabbit save`.
*   **No requests recorded**: Interact with the page, then `grabbit browse --session <name> snapshot`.

## Reference

For the full list of commands (cookies, storage, network, advanced locators), see [cli_reference.md](references/cli_reference.md).

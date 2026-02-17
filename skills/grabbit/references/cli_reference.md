# Grabbit CLI Reference

## Installation

```bash
npm i -g @cole-labs/grabbit
```

## Commands

### `auth`
Authenticate with the Grabbit service. Opens a browser window to pair.
```bash
grabbit auth
```

### `validate`
Check if the current authentication token is valid.
```bash
grabbit validate
```

### `check`
Check the status of a submitted workflow generation task.
```bash
grabbit check <task-id>
```

### `skill`
Install the Grabbit skill in the current directory.
```bash
grabbit skill install
```

### `add`
Install a generated workflow as a local skill for AI agents.
```bash
grabbit add <workflow-id>
```

### `keys`
Manage API keys for programmatic integration.
```bash
grabbit keys list           # List active keys
grabbit keys create <name>  # Create a new key
grabbit keys show           # Show the current key from local config
```

### `workflows`
List saved workflows (title + id + description).
```bash
grabbit workflows
```

### `save`
Submit a captured HAR for workflow generation.
```bash
grabbit save [options] <prompt>
```
**Options:**
- `--session <name>`: Session to export HAR from (required if not inferred).
- `--model <id>`: Specific model to use (default: openai/gpt-5.2-codex).
- `--step <text>`: Step hint (repeatable).

**Example:**
```bash
grabbit save --session demo "Extract titles. Example: 'Hello World'. Output: { titles: string[] }"
```

### `browse`
Control a browser session for recording interactions.
```bash
grabbit browse [flags] <command> [args...]
```

**Flags:**
- `--session <name>`: Named session (persistent until closed).
- `--headed`: Run browser in headed mode (visible).
- `--profile <path>`: Use custom user data directory.
- `--proxy <url>`: Use proxy server.
- `--user-agent <string>`: Custom user agent.

## Browser Commands

Usage: `grabbit browse --session <name> <command> [args]`

### Navigation
- `open <url>`: Navigate to URL. Starts HAR recording automatically.
- `reload`: Reload current page.
- `back`: Go back.
- `forward`: Go forward.

### Inspection
- `snapshot`: Dump accessibility tree with `@e#` references.
- `get text <selector>`: Get text content.
- `get html <selector>`: Get inner HTML.
- `get value <selector>`: Get input value.
- `get attr <selector> <name>`: Get attribute value.
- `is visible <selector>`: Check visibility.
- `count <selector>`: Count matching elements.

### Interaction
- `click <selector>`: Click element.
- `dblclick <selector>`: Double click.
- `fill <selector> <value>`: Fill input.
- `type <selector> <text>`: Type text (keystrokes).
- `press <key>`: Press keyboard key (e.g., Enter, ArrowDown).
- `check <selector>`: Check checkbox/radio.
- `uncheck <selector>`: Uncheck.
- `select <selector> <value>`: Select option.
- `hover <selector>`: Hover over element.
- `focus <selector>`: Focus element.
- `scroll <x> <y>`: Scroll page.
- `scrollintoview <selector>`: Scroll element into view.
- `upload <selector> <file...>`: Upload files.
- `drag <source> <target>`: Drag and drop.

### Locators (Advanced)
- `getbyrole <role> --name <name>`
- `getbytext <text>`
- `getbylabel <label>`
- `getbyplaceholder <placeholder>`

### State & Debug
- `cookies get`: Get cookies.
- `cookies set <json>`: Set cookies.
- `cookies clear`: Clear cookies.
- `storage <local|session> get [key]`: Get storage.
- `storage <local|session> set <key> <value>`: Set storage.
- `storage <local|session> clear`: Clear storage.
- `screenshot [path]`: Take screenshot.
- `console`: Dump console logs.
- `errors`: Dump page errors.
- `network requests`: List network requests.

### HAR Control
- `har start`: Start recording.
- `har stop`: Stop recording.
- `har export`: Dump HAR JSON.
- `har clear`: Clear recorded entries.

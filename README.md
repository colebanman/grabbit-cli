# Grabbit CLI

Turn browser actions into reusable API workflows. Browse a site, capture what you do, and Grabbit generates stable cURL-ready workflows for automation, data extraction, and integrations.

## Install

```bash
npm i -g @cole-labs/grabbit
```

## Get started

### 1. Sign in (one-time)

```bash
grabbit auth
```

Your browser opens to pair. Sign in, then enter the code from the page into your terminal.

### 2. Open a site and interact

```bash
# Open a page (use --headed if you need to see the browser, e.g. for logins)
grabbit browse --session myrun open https://example.com

# Inspect and interact
grabbit browse --session myrun snapshot
grabbit browse --session myrun click @e3
grabbit browse --session myrun fill @e5 "search term"
```

### 3. Save and generate

```bash
grabbit save --session myrun "Describe what you want. Example: Extract product titles. Output: { titles: string[] }"
```

### 4. Check the result

```bash
grabbit check <task-id>
```

When it’s done, you’ll see inputs, outputs, and a cURL example.

## Prompt tips

Be specific. Include real examples you saw on the page and the output shape you expect.

- **Static data**: "Extract blog titles, e.g. 'Cooking for Beginners'. Output: { titles: string[] }"
- **Interactive flows**: Describe each step with example data (name, address, etc.)
- **Generalize**: Even for one value, phrase it so the workflow works for many cases

## Browser commands

Run `grabbit browse --help` for the full list. Common commands:

- **Navigate**: `open`, `back`, `forward`, `reload`, `close`
- **Inspect**: `snapshot`, `get text`, `get html`, `get value`, `is visible`
- **Interact**: `click`, `fill`, `type`, `press`, `select`, `hover`, `focus`
- **Wait**: `wait <ms>` or `wait <selector>`
- **Debug**: `screenshot`, `console`, `errors`

## Use workflows in AI agents

To add Grabbit as a skill for AI agents (e.g. Cursor, Claude):

```bash
grabbit skill install
```

## Troubleshooting

- **Not authenticated**: Run `grabbit auth`, then retry.
- **No requests recorded**: Reload the page, interact with it, then run `save` again.
- Always use `--session <name>` so captures stay separate.

## Credits

Grabbit’s browser automation is powered by a fork of [agent-browser](https://github.com/vercel-labs/agent-browser), licensed under the Apache License 2.0.

## License

MIT

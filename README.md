# Grabbit CLI

Grabbit is a powerful tool designed to turn browser interactions into deterministic API workflows. By capturing network traffic (HAR) and accessibility snapshots from your browsing sessions, Grabbit allows you to generate stable, reproducible API calls for automation, data extraction, and integration tasks.

## Install

```bash
npm i -g @cole-labs/grabbit
```

## Configuration

The CLI can be configured via (in order of priority):

1. **Environment variables** - `GRABBIT_API_URL`, `GRABBIT_TOKEN`
2. **Config file** - `~/.grabbit/config.json` (auto-created after `grabbit auth`)
3. **Defaults** - Production API at `https://www.grabbit.dev`

### Environment Variables

```bash
# Use local development backend
export GRABBIT_API_URL=http://localhost:3001
grabbit auth

# One-time use
GRABBIT_API_URL=http://localhost:3001 grabbit auth
```

### Config File

After running `grabbit auth`, your config is stored at `~/.grabbit/config.json`:

```json
{
  "token": "your-auth-token",
  "apiUrl": "https://www.grabbit.dev",
  "userId": "user_..."
}
```

To switch environments, re-run `grabbit auth` or set the `GRABBIT_API_URL` env var.

## Authenticate (one-time)

```bash
grabbit validate
grabbit auth
```

- `grabbit auth` opens the pairing page in your browser; sign in, then enter the code shown on the page into your terminal.
- The CLI will use the `GRABBIT_API_URL` environment variable if set, otherwise defaults to production.

## Capture + Generate (recommended flow)

1) Open a site in a named browser session

```bash
# Headed (recommended for logins / bot protection)
grabbit browse --headed --session myrun open https://example.com

# Headless
grabbit browse --session myrun open https://example.com
```

2) Interact as needed (optional, but usually necessary)

```bash
grabbit browse --session myrun snapshot
grabbit browse --session myrun click @e3
grabbit browse --session myrun fill @e7 "test@example.com"
grabbit browse --session myrun press Enter
```

3) Save + submit for workflow generation

```bash
grabbit save --session myrun "Describe the workflow in detail (see Prompt Tips)."
```

4) Poll for completion

```bash
grabbit check <task-id>
```

On success, `check` prints:
- inputs
- outputs
- a cURL example (when available)

## Prompt Tips (be verbose)

The generation backend finds the right requests faster when your prompt includes concrete examples.

- Include expected inputs/outputs *and example values*
- For static extraction, include a real example string you saw on the site
- For multi-step flows, include example data for each step (name/address/etc.)
- Even if user asked for a single value, phrase it so the workflow generalizes

Examples:

Static:
```text
Extract blog post titles from someblogsite.com, e.g., "Cooking for Beginners".
Output: { titles: string[] }.
```

Interactive:
```text
Checkout an item using its product link. Example: open amazon.com/productxyz, add to cart,
go to checkout, enter name "John Doe", address "123 Address Way", select standard shipping,
stop before final confirm. Output: { item_title, order_total }.
```

Generalize:
```text
Get stock price from Yahoo Finance. Input: symbol (e.g., "AAPL"). Output: { price, change, changePct, timestamp }.
```

## Browser Command Cheat Sheet

Run `grabbit browse --help` for the full list. Common commands:

- Navigate: `open`, `back`, `forward`, `reload`, `close`
- Inspect: `snapshot`, `get text|html|value|attr`, `is visible|enabled|checked`
- Interact: `click`, `dblclick`, `fill`, `type`, `press`, `select`, `hover`, `focus`
- Wait: `wait <ms>` or `wait <selector>`
- Debug: `screenshot`, `console`, `errors`
- HAR: `har start|stop|export|clear`

## Sessions

- Always use `--session <name>` so captures don’t mix.
- `save` closes the browser session after submitting.

## Troubleshooting

- **Not authenticated**: run `grabbit auth`, then retry your command.
- **0 requests recorded**: reload the page and interact, then run `save` again.
## Credits

Grabbit's browser automation capabilities are powered by a fork of [agent-browser](https://github.com/vercel-labs/agent-browser), which is licensed under the Apache License 2.0. We are grateful to the Vercel team and the original contributors for their excellent work.

## License

MIT


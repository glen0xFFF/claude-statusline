# claude-statusline

A one-line [Claude Code status line](https://code.claude.com/docs/en/statusline):

```
🤖 Model: Opus | 💰 Cost: $0.01 | 📊 Context: 8% | 📅 7d: 41% (resets Fri 16:27)
```

| Segment | Source field | Notes |
|---|---|---|
| Model | `model.display_name` | |
| Cost | `cost.total_cost_usd` | Client-side estimate at list price; may differ from your bill |
| Context | `context_window.used_percentage` | `0%` early in a session, before the field is populated |
| 7d | `rate_limits.seven_day.used_percentage` / `.resets_at` | Only for claude.ai Pro/Max/Ultra, after the first response. Shows `--` otherwise. Reset time is local, 24h; date is added when it is 6+ days out |

## Requirements

- **bash**: built in on macOS/Linux. On Windows, Git Bash (already required by Claude Code on Windows).
- **Node.js**: used to parse the JSON. No `jq` needed.

## Install

```sh
git clone https://github.com/glen0xFFF/claude-statusline.git
cd claude-statusline
node install.js --dry-run   # optional: preview changes
node install.js
```

The installer:

1. Copies `statusline.sh` to `~/.claude/statusline.sh`.
2. Sets **only** the `statusLine` key in `~/.claude/settings.json`. Every other setting is left as is.
3. Backs up both files (`*.bak-<timestamp>`) before overwriting them.
4. Aborts without changing anything if `settings.json` is not valid JSON.

It honours `CLAUDE_CONFIG_DIR` if you have that set. Re-run it after `git pull` to update.

Then start a new Claude Code session.

## Uninstall

Remove the `statusLine` key from `~/.claude/settings.json` and delete `~/.claude/statusline.sh`.

## Hacking

Test the script with a sample payload:

```sh
echo '{"model":{"display_name":"Opus"},"cost":{"total_cost_usd":0.5},"context_window":{"used_percentage":8},"rate_limits":{"seven_day":{"used_percentage":41,"resets_at":'$(( $(date +%s) + 86400 ))'}}}' | bash statusline.sh
```

The JavaScript lives inside a single-quoted bash string, so **don't use `'` anywhere in it**, including comments. A stray apostrophe ends the string and breaks the whole script.

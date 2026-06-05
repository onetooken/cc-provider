# CC Provider

CC Provider is a VS Code extension for switching Claude Code provider settings from the left sidebar.

It writes provider-related values to `~/.claude/settings.json`, while preserving unrelated settings. Provider presets are editable defaults, not fixed rules.

## Features

- Sidebar UI for DeepSeek, Zhipu GLM Coding Plan, and Xiaomi MiMo Token Plan.
- Editable base URL, model slots, API token, and custom environment variables.
- 1M context and max effort toggles.
- API tokens stored with VS Code SecretStorage.
- Timestamped backup before writing `~/.claude/settings.json`.
- Placeholder area for future quota and usage integrations.

## Development

```bash
npm install
npm run compile
npm test
npm run package
```

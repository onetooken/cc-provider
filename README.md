<p align="center">
  <img src="media/icon.png" alt="CC Provider logo" width="128" height="128">
</p>

# CC Provider

CC Provider is a small VS Code extension for switching Claude Code provider settings without opening and editing JSON by hand. It is designed for people who move between Anthropic-compatible providers and want a fast, visible way to keep `~/.claude/settings.json` aligned with the provider they intend to use. It is especially useful for Claude Code users working in WSL2, SSH Remote, containers, or other remote VS Code environments where there is no local GUI for managing provider settings.

## Why It Helps

Claude Code provider switching usually means remembering the right base URL, token variable, model names, and a handful of related settings. CC Provider keeps those values in a sidebar form, lets you switch presets quickly, and writes the selected configuration safely.

The provider cards show whether a configuration has already been applied or is still pending, which helps avoid confusion when multiple VS Code or Claude Code windows are open. The settings preview also shows the current `~/.claude/settings.json` content so you can verify what has been written.

For WSL2 and SSH Remote workflows, the extension runs inside the same remote VS Code context that owns `~/.claude/settings.json`, so applying a provider updates the settings file Claude Code will actually read. This avoids copying tokens between host and remote machines or editing hidden files through a terminal-only workflow.

## Current Features

- Left sidebar UI for Claude Code provider configuration.
- Built-in editable presets for DeepSeek, Zhipu GLM Coding Plan, and Xiaomi MiMo Token Plan.
- Custom provider creation for additional Anthropic-compatible endpoints.
- Editable base URL, API token, model slots, and custom environment variables.
- Default model values include `[1m]` where the preset uses a 1M-context model, and every model field remains editable.
- Safe token storage through VS Code SecretStorage.
- Timestamped backup before writing `~/.claude/settings.json`.
- Managed controls for max effort, nonessential traffic, cc co-author attribution, permission default mode, and auto theme.
- Reserved usage/quota area for future provider-specific integrations.
- English UI by default, with Simplified Chinese UI when VS Code runs in `zh-cn` or `zh-hans`.

## Default Providers

- DeepSeek: `https://api.deepseek.com/anthropic`
- Zhipu GLM Coding Plan: `https://open.bigmodel.cn/api/anthropic`
- Xiaomi MiMo Token Plan: `https://token-plan-cn.xiaomimimo.com/anthropic`

All preset values are defaults only. You can edit provider names, URLs, model names, environment variables, and switches before saving or applying.

## Open Source and Feedback

CC Provider is open source on GitHub. If you run into problems or want to request improvements, please open an issue in [onetooken/cc-provider](https://github.com/onetooken/cc-provider).

## Development

```bash
npm install
npm run compile
npm test
npm run package
```

The package command creates a VSIX file in the project root.

---

# CC Provider 中文说明

CC Provider 是一个用于切换 Claude Code 提供商配置的 VS Code 扩展。它把常见的 provider、base URL、模型名、Token 和相关开关放到左侧侧栏里，避免每次手动打开 `~/.claude/settings.json` 修改 JSON。它尤其适合在 WSL2、SSH Remote、容器或其它远程 VS Code 环境里使用 Claude Code 的用户，因为这些场景通常没有本地 GUI 可以直接管理 provider 配置。

## 为什么方便

切换 Claude Code 提供商时，经常需要同时改 base URL、Token、模型槽位和一些环境变量。CC Provider 把这些配置整理成表单，选中一个 Provider 后点“应用”即可写入 settings。

Provider 卡片会显示“已应用”或“待应用”，帮助你区分当前只是选中了配置，还是已经真正写入 `~/.claude/settings.json`。这在多窗口、多会话场景下尤其有用。侧栏里也会显示当前 settings 预览，便于确认实际写入结果。

在 WSL2 和 SSH Remote 工作流中，扩展运行在拥有 `~/.claude/settings.json` 的同一个远程 VS Code 上下文里。因此点击“应用”会更新 Claude Code 实际读取的 settings 文件，避免在宿主机和远程环境之间复制 Token，也不用通过纯终端流程反复编辑隐藏文件。

## 当前功能

- 左侧侧栏管理 Claude Code provider 配置。
- 内置 DeepSeek、Zhipu GLM Coding Plan、Xiaomi MiMo Token Plan，且所有默认值都可编辑。
- 支持新增自定义 Provider，用于其它 Anthropic 兼容端点。
- 可编辑 base URL、API Token、模型槽位和自定义环境变量。
- 默认模型值会直接显示 `[1m]` 标识；插件不隐藏模型名细节，所有模型字段都可以手动修改。
- API Token 使用 VS Code SecretStorage 保存。
- 写入 `~/.claude/settings.json` 前会创建时间戳备份。
- 提供 max effort、禁用非必要流量、去除 cc co-author 声明、权限默认模式、主题 auto 等托管配置。
- 预留用量和额度区域，后续可接入不同厂商接口。
- 默认英文界面；当 VS Code 语言为 `zh-cn` 或 `zh-hans` 时显示简体中文。

## 默认 Provider

- DeepSeek：`https://api.deepseek.com/anthropic`
- Zhipu GLM Coding Plan：`https://open.bigmodel.cn/api/anthropic`
- Xiaomi MiMo Token Plan：`https://token-plan-cn.xiaomimimo.com/anthropic`

这些只是默认预置，不是固定规则。你可以在应用前修改名称、URL、模型名、环境变量和开关。

## 开源与反馈

CC Provider 已在 GitHub 开源。如果遇到问题，或希望提出改进建议，可以在 [onetooken/cc-provider](https://github.com/onetooken/cc-provider) 提交 issue。

## 开发

```bash
npm install
npm run compile
npm test
npm run package
```

打包命令会在项目根目录生成 VSIX 文件。

import * as vscode from "vscode";

export function getWebviewHtml(webview: vscode.Webview): string {
  const nonce = getNonce();
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CC Provider</title>
  <style>
    :root {
      --gap: 10px;
      --radius: 6px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 12px;
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }
    .app { display: grid; gap: 12px; min-width: 260px; }
    .provider-list { display: grid; gap: 6px; }
    .provider-button {
      width: 100%;
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: var(--radius);
      color: var(--vscode-foreground);
      background: var(--vscode-list-inactiveSelectionBackground);
      padding: 9px 10px;
      text-align: left;
      cursor: pointer;
    }
    .provider-button.active {
      border-color: var(--vscode-focusBorder);
      background: var(--vscode-list-activeSelectionBackground);
      color: var(--vscode-list-activeSelectionForeground);
    }
    .provider-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .name-row, .actions, .row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .name-row { justify-content: space-between; }
    .muted { color: var(--vscode-descriptionForeground); }
    .tiny { font-size: 11px; }
    .section {
      border-top: 1px solid var(--vscode-sideBarSectionHeader-border, var(--vscode-panel-border));
      padding-top: 12px;
      display: grid;
      gap: var(--gap);
    }
    h2, h3 { margin: 0; font-size: 13px; font-weight: 600; }
    label { display: grid; gap: 5px; }
    input, textarea, select {
      width: 100%;
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: 4px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      padding: 7px 8px;
      font: inherit;
    }
    textarea {
      min-height: 92px;
      resize: vertical;
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
    }
    button {
      border: 1px solid var(--vscode-button-border, transparent);
      border-radius: 4px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      padding: 7px 9px;
      cursor: pointer;
      font: inherit;
      min-height: 30px;
    }
    button.primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    button.icon {
      width: 30px;
      min-width: 30px;
      padding: 0;
      font-weight: 700;
    }
    .actions button { flex: 1; }
    .switch-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .switch-row input { width: auto; }
    .env-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 30px;
      gap: 6px;
      align-items: center;
    }
    pre {
      margin: 0;
      border: 1px solid var(--vscode-panel-border);
      border-radius: var(--radius);
      padding: 8px;
      max-height: 220px;
      overflow: auto;
      background: var(--vscode-textCodeBlock-background);
      font-family: var(--vscode-editor-font-family);
      font-size: 11px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .status {
      min-height: 18px;
      color: var(--vscode-descriptionForeground);
    }
    .pill {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--vscode-badge-background);
      border-radius: 999px;
      padding: 1px 7px;
      font-size: 11px;
    }
    .pill.pending {
      border-color: var(--vscode-notificationsWarningIcon-foreground);
      color: var(--vscode-notificationsWarningIcon-foreground);
    }
    .pill.applied {
      border-color: var(--vscode-testing-iconPassed);
      color: var(--vscode-testing-iconPassed);
    }
  </style>
</head>
<body>
  <main class="app">
    <div class="actions">
      <button class="primary" id="addProvider">新增 Provider</button>
    </div>
    <div class="provider-list" id="providerList"></div>

    <section class="section">
      <div class="name-row">
        <h2 id="providerTitle">Provider</h2>
        <span class="pill" id="tokenStatus">Token</span>
      </div>
      <label>
        <span>名称</span>
        <input id="displayName" autocomplete="off">
      </label>
      <label>
        <span>Base URL</span>
        <input id="baseUrl" autocomplete="off">
      </label>
      <label>
        <span>API Token</span>
        <input id="authToken" type="password" autocomplete="off" placeholder="留空则使用已保存 Token">
      </label>
    </section>

    <section class="section">
      <h3>模型槽位</h3>
      <label><span>ANTHROPIC_MODEL</span><input id="model"></label>
      <label><span>OPUS</span><input id="opus"></label>
      <label><span>SONNET</span><input id="sonnet"></label>
      <label><span>HAIKU</span><input id="haiku"></label>
      <label><span>SUBAGENT</span><input id="subagent"></label>
      <div class="switch-row">
        <span>max effort</span>
        <input id="maxEffort" type="checkbox">
      </div>
      <div class="switch-row">
        <span>去除 cc co-author 声明</span>
        <input id="disableClaudeAttribution" type="checkbox">
      </div>
      <div class="switch-row">
        <span>禁用非必要流量</span>
        <input id="disableNonessentialTraffic" type="checkbox">
      </div>
      <div class="switch-row">
        <span>默认开启 auto mode</span>
        <input id="enableAutoMode" type="checkbox">
      </div>
    </section>

    <section class="section">
      <div class="name-row">
        <h3>自定义 env</h3>
        <button class="icon" id="addEnv" title="添加环境变量">+</button>
      </div>
      <div id="envRows"></div>
    </section>

    <section class="section">
      <h3>用量</h3>
      <div class="muted tiny">用量限制和使用情况接口已预留，当前版本暂不连接厂商 API。</div>
    </section>

    <section class="section">
      <div class="actions">
        <button id="reset">恢复默认</button>
        <button id="deleteProvider">删除</button>
        <button id="save">保存</button>
      </div>
      <div class="actions">
        <button id="openSettings">打开 settings</button>
        <button class="primary" id="apply">应用</button>
      </div>
      <div class="status" id="status"></div>
    </section>

    <section class="section">
      <h3>当前 settings.json</h3>
      <div class="muted tiny" id="settingsPath"></div>
      <pre id="preview"></pre>
    </section>
  </main>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let state = {};
    let activeProvider = "";

    const ids = ["displayName", "baseUrl", "authToken", "model", "opus", "sonnet", "haiku", "subagent", "maxEffort", "disableClaudeAttribution", "disableNonessentialTraffic", "enableAutoMode"];
    const el = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
    const providerList = document.getElementById("providerList");
    const envRows = document.getElementById("envRows");

    window.addEventListener("message", (event) => {
      const message = event.data;
      if (message.type === "state") {
        state = message.payload;
        activeProvider = state.activeProvider || state.presets[0].id;
        render();
      }
      if (message.type === "error") {
        document.getElementById("status").textContent = message.payload;
      }
    });

    document.getElementById("save").addEventListener("click", () => post("saveConfig", collectConfig()));
    document.getElementById("apply").addEventListener("click", () => post("applyConfig", collectConfig()));
    document.getElementById("addProvider").addEventListener("click", () => post("addProvider", {}));
    document.getElementById("deleteProvider").addEventListener("click", () => post("deleteProvider", { providerId: activeProvider }));
    document.getElementById("reset").addEventListener("click", () => post("resetProvider", { providerId: activeProvider }));
    document.getElementById("openSettings").addEventListener("click", () => post("openSettings", {}));
    document.getElementById("addEnv").addEventListener("click", () => addEnvRow("", ""));

    post("ready", {});

    function render() {
      renderProviders();
      const config = currentConfig();
      const provider = currentProvider();
      document.getElementById("providerTitle").textContent = config.displayName || provider.name;
      document.getElementById("tokenStatus").textContent = state.tokenStatus?.[activeProvider] ? "Token 已保存" : "Token 未保存";
      document.getElementById("reset").disabled = !provider.isBuiltin;
      document.getElementById("deleteProvider").disabled = provider.isBuiltin;
      el.displayName.value = config.displayName || provider.name || "";
      el.baseUrl.value = config.baseUrl || "";
      el.authToken.value = "";
      el.model.value = config.models?.model || "";
      el.opus.value = config.models?.opus || "";
      el.sonnet.value = config.models?.sonnet || "";
      el.haiku.value = config.models?.haiku || "";
      el.subagent.value = config.models?.subagent || "";
      el.maxEffort.checked = Boolean(config.maxEffort);
      el.disableClaudeAttribution.checked = config.disableClaudeAttribution !== false;
      el.disableNonessentialTraffic.checked = config.disableNonessentialTraffic !== false;
      el.enableAutoMode.checked = config.enableAutoMode !== false;
      renderEnvRows(config.customEnv || {});
      document.getElementById("settingsPath").textContent = state.settingsPath || "";
      document.getElementById("preview").textContent = state.settingsError || state.settingsPreview || "{}";
      document.getElementById("status").textContent = state.status || "";
    }

    function renderProviders() {
      providerList.innerHTML = "";
      for (const provider of state.providers || []) {
        const button = document.createElement("button");
        button.className = "provider-button" + (provider.id === activeProvider ? " active" : "");
        button.innerHTML = "<div class='provider-head'><strong>" + escapeHtml(provider.name) + "</strong>" + providerBadge(provider.id) + "</div><div class='muted tiny'>" + escapeHtml(provider.baseUrl) + "</div>";
        button.addEventListener("click", () => {
          activeProvider = provider.id;
          render();
        });
        providerList.appendChild(button);
      }
    }

    function providerBadge(providerId) {
      if (providerId === state.appliedProvider) {
        return "<span class='pill applied'>已应用</span>";
      }
      if (providerId === activeProvider) {
        return "<span class='pill pending'>待应用</span>";
      }
      return "";
    }

    function renderEnvRows(env) {
      envRows.innerHTML = "";
      const entries = Object.entries(env);
      if (entries.length === 0) {
        addEnvRow("", "");
        return;
      }
      for (const [key, value] of entries) {
        addEnvRow(key, value);
      }
    }

    function addEnvRow(key, value) {
      const row = document.createElement("div");
      row.className = "env-row";
      row.innerHTML = "<input class='env-key' placeholder='KEY'><input class='env-value' placeholder='value'><button class='icon' title='删除'>x</button>";
      row.querySelector(".env-key").value = key;
      row.querySelector(".env-value").value = value;
      row.querySelector("button").addEventListener("click", () => row.remove());
      envRows.appendChild(row);
    }

    function collectConfig() {
      return {
        providerId: activeProvider,
        displayName: el.displayName.value,
        baseUrl: el.baseUrl.value,
        authToken: el.authToken.value,
        models: {
          model: el.model.value,
          opus: el.opus.value,
          sonnet: el.sonnet.value,
          haiku: el.haiku.value,
          subagent: el.subagent.value
        },
        customEnv: collectEnv(),
        maxEffort: el.maxEffort.checked,
        disableClaudeAttribution: el.disableClaudeAttribution.checked,
        disableNonessentialTraffic: el.disableNonessentialTraffic.checked,
        enableAutoMode: el.enableAutoMode.checked
      };
    }

    function collectEnv() {
      const env = {};
      for (const row of envRows.querySelectorAll(".env-row")) {
        const key = row.querySelector(".env-key").value.trim();
        const value = row.querySelector(".env-value").value.trim();
        if (key) {
          env[key] = value;
        }
      }
      return env;
    }

    function currentProvider() {
      return (state.providers || []).find((provider) => provider.id === activeProvider) || state.providers[0];
    }

    function currentConfig() {
      return state.configs?.[activeProvider] || {};
    }

    function post(type, payload) {
      vscode.postMessage({ type, payload });
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char]));
    }
  </script>
</body>
</html>`;
}

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 32; i += 1) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

import * as vscode from "vscode";
import { AppLocale, AppMessages } from "./i18n";

export function getWebviewHtml(webview: vscode.Webview, locale: AppLocale, messages: AppMessages): string {
  const nonce = getNonce();
  const msgJson = JSON.stringify(messages).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CC Provider</title>
  <style>
    :root {
      --gap: 8px;
      --radius: 6px;
      --card-border: var(--vscode-input-border, var(--vscode-panel-border));
      --blue: var(--vscode-focusBorder);
      --blue-bg: color-mix(in srgb, var(--vscode-focusBorder) 9%, var(--vscode-sideBar-background));
      --green: var(--vscode-testing-iconPassed);
      --green-bg: color-mix(in srgb, var(--vscode-testing-iconPassed) 10%, var(--vscode-sideBar-background));
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 10px;
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }
    .app {
      display: grid;
      gap: 10px;
      min-width: 240px;
      max-width: 560px;
      margin: 0 auto;
    }
    .title {
      margin: 0 0 2px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0;
      text-transform: uppercase;
    }
    .card {
      display: grid;
      gap: var(--gap);
      padding: 10px;
      border: 1px solid var(--card-border);
      border-radius: var(--radius);
      background: var(--vscode-sideBar-background);
    }
    .top-actions {
      display: grid;
      gap: 8px;
    }
    .top-actions button {
      width: 100%;
    }
    .provider-list {
      display: grid;
      gap: 6px;
    }
    .provider-card {
      width: 100%;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 8px;
      align-items: center;
      border: 1px solid var(--card-border);
      border-radius: var(--radius);
      color: var(--vscode-foreground);
      background: var(--vscode-list-inactiveSelectionBackground, var(--vscode-sideBar-background));
      padding: 8px 8px 8px 10px;
      text-align: left;
      cursor: pointer;
    }
    .provider-card.active {
      border-color: var(--blue);
      background: var(--blue-bg);
    }
    .provider-main {
      min-width: 0;
      display: grid;
      gap: 2px;
    }
    .provider-name {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      min-width: 0;
      font-weight: 600;
    }
    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .provider-url {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      overflow-wrap: anywhere;
    }
    h2, h3, h4 {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
    }
    h4 {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }
    label {
      display: grid;
      gap: 5px;
      min-width: 0;
    }
    input, textarea, select {
      width: 100%;
      min-width: 0;
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: 4px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      padding: 6px 8px;
      font: inherit;
    }
    textarea {
      min-height: 84px;
      resize: vertical;
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
    }
    button {
      border: 1px solid var(--vscode-button-border, transparent);
      border-radius: 4px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      padding: 6px 9px;
      cursor: pointer;
      font: inherit;
      min-height: 30px;
      white-space: nowrap;
    }
    button.primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    button.danger {
      color: var(--vscode-errorForeground);
    }
    button.icon {
      width: 30px;
      min-width: 30px;
      padding: 0;
      font-weight: 700;
    }
    button.token-toggle {
      width: 44px;
      min-width: 44px;
      height: 30px;
      padding: 0 6px;
      font-size: 12px;
      font-weight: 400;
    }
    button:disabled {
      cursor: default;
      opacity: 0.55;
    }
    .header-row, .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
    }
    .field-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: end;
    }
    .token-input {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 44px;
      gap: 6px;
    }
    .check-row {
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr);
      gap: 7px;
      align-items: center;
      min-height: 24px;
    }
    .check-row input {
      width: auto;
      margin: 0;
    }
    .switch-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 24px;
    }
    .switch-row input {
      width: auto;
      margin: 0;
      flex: 0 0 auto;
    }
    .actions {
      display: grid;
      gap: 8px;
    }
    .action-card {
      gap: 7px;
    }
    .action-card button {
      width: 100%;
      min-width: 0;
      white-space: normal;
      line-height: 1.25;
    }
    .secondary-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .minor-actions {
      display: flex;
      justify-content: center;
      gap: 8px;
      padding-top: 2px;
    }
    .minor-actions button {
      width: auto;
      min-height: 26px;
      border-color: transparent;
      background: transparent;
      padding: 3px 8px;
      font-size: 12px;
    }
    .env-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 30px;
      gap: 6px;
      align-items: center;
      margin-bottom: 6px;
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
    details {
      display: grid;
      gap: 7px;
    }
    details > summary {
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: 4px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      padding: 6px 8px;
      cursor: pointer;
    }
    details > summary::-webkit-details-marker { display: none; }
    details > summary::after {
      content: "›";
      color: var(--vscode-descriptionForeground);
      font-size: 18px;
      line-height: 1;
    }
    details[open] > summary::after {
      transform: rotate(90deg);
    }
    details > .details-content {
      display: grid;
      gap: 8px;
      padding-top: 8px;
    }
    .status {
      min-height: 18px;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }
    .status.dirty {
      color: var(--vscode-notificationsWarningIcon-foreground);
    }
    .muted {
      color: var(--vscode-descriptionForeground);
    }
    .tiny {
      font-size: 11px;
      line-height: 1.35;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--vscode-badge-background);
      border-radius: 999px;
      padding: 1px 7px;
      min-height: 20px;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      white-space: nowrap;
    }
    .pill.applied {
      border-color: var(--green);
      background: var(--green-bg);
      color: var(--green);
    }
    .pill.pending {
      border-color: var(--vscode-notificationsWarningIcon-foreground);
      color: var(--vscode-notificationsWarningIcon-foreground);
    }
  </style>
</head>
<body>
  <main class="app">
    <h1 class="title">CC PROVIDER: PROVIDERS</h1>

    <section class="top-actions">
      <button class="primary" id="addProvider">${escapeHtml(messages.addProvider)}</button>
      <div class="status" id="status"></div>
    </section>

    <div class="provider-list" id="providerList"></div>

    <section class="card">
      <div class="header-row">
        <h2>${escapeHtml(messages.connectionConfig)}</h2>
        <span class="pill" id="tokenStatus">Token</span>
      </div>
      <label>
        <span>${escapeHtml(messages.displayName)}</span>
        <input id="displayName" autocomplete="off">
      </label>
      <label>
        <span>${escapeHtml(messages.baseUrl)}</span>
        <input id="baseUrl" autocomplete="off">
      </label>
      <div class="field-row">
        <label>
          <span>${escapeHtml(messages.apiToken)}</span>
          <span class="token-input">
            <input id="authToken" type="password" autocomplete="off" placeholder="${escapeHtml(messages.tokenPlaceholder)}">
            <button class="token-toggle" id="toggleToken" title="${escapeHtml(messages.apiToken)}" type="button">${escapeHtml(messages.tokenShow)}</button>
          </span>
        </label>
      </div>
    </section>

    <section class="card">
      <h2>${escapeHtml(messages.modelConfig)}</h2>
      <label>
        <span>默认模型</span>
        <input id="model" autocomplete="off">
      </label>
      <label class="check-row">
        <input id="useDefaultForAllModels" type="checkbox">
        <span>${escapeHtml(messages.enableAllModelSlots)}</span>
      </label>
      <details id="advancedModels">
        <summary>${escapeHtml(messages.advancedModelMapping)}</summary>
        <div class="details-content">
          <label><span>OPUS</span><input id="opus" autocomplete="off"></label>
          <label><span>SONNET</span><input id="sonnet" autocomplete="off"></label>
          <label><span>HAIKU</span><input id="haiku" autocomplete="off"></label>
          <label><span>SUBAGENT</span><input id="subagent" autocomplete="off"></label>
        </div>
      </details>
    </section>

    <section class="card">
      <h2>选项</h2>
      <label class="switch-row">
        <span>Max effort</span>
        <input id="maxEffort" type="checkbox">
      </label>
      <label class="switch-row">
        <span>${escapeHtml(messages.disableAttribution)}</span>
        <input id="disableClaudeAttribution" type="checkbox">
      </label>
      <label class="switch-row">
        <span>${escapeHtml(messages.disableNonessentialTraffic)}</span>
        <input id="disableNonessentialTraffic" type="checkbox">
      </label>
      <label>
        <span>${escapeHtml(messages.permissionDefaultMode)}</span>
        <select id="permissionDefaultMode">
          <option value="none">${escapeHtml(messages.permissionDefaultModeNone)}</option>
          <option value="auto">${escapeHtml(messages.permissionDefaultModeAuto)}</option>
          <option value="bypassPermissions">${escapeHtml(messages.permissionDefaultModeBypass)}</option>
        </select>
      </label>
      <label class="switch-row">
        <span>${escapeHtml(messages.themeAuto)}</span>
        <input id="enableAutoTheme" type="checkbox">
      </label>
    </section>

    <section class="card">
      <h2>${escapeHtml(messages.advanced)}</h2>
      <details id="customEnvDetails">
        <summary>${escapeHtml(messages.customEnv)}</summary>
        <div class="details-content">
          <div class="header-row">
            <span class="muted tiny">${escapeHtml(messages.customEnv)}</span>
            <button class="icon" id="addEnv" title="${escapeHtml(messages.customEnv)}" type="button">+</button>
          </div>
          <div id="envRows"></div>
        </div>
      </details>
      <details id="settingsPreviewDetails">
        <summary>${escapeHtml(messages.settingsPreview)}</summary>
        <div class="details-content">
          <div class="muted tiny" id="settingsPath"></div>
          <pre id="preview"></pre>
        </div>
      </details>
      <div class="muted tiny">${escapeHtml(messages.tokenSecureHint)}</div>
    </section>

    <section class="card">
      <h2>${escapeHtml(messages.quota)}</h2>
      <div class="muted tiny">${escapeHtml(messages.quotaPlaceholder)}</div>
    </section>

    <section class="card action-card">
      <div class="actions">
        <button class="primary" id="apply">${escapeHtml(messages.saveAndApply)}</button>
      </div>
      <div class="secondary-actions">
        <button id="save">${escapeHtml(messages.save)}</button>
        <button id="openSettings">${escapeHtml(messages.openSettings)}</button>
      </div>
      <div class="minor-actions">
        <button id="reset">${escapeHtml(messages.reset)}</button>
        <button class="danger" id="deleteProvider">${escapeHtml(messages.confirmDeleteButton)}</button>
      </div>
    </section>
  </main>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const messages = ${msgJson};
    const savedTokenMask = "••••••••••••";
    let state = {};
    let activeProvider = "";
    let baseline = "";
    let isRendering = false;
    let tokenVisible = false;

    const ids = [
      "displayName",
      "baseUrl",
      "authToken",
      "model",
      "opus",
      "sonnet",
      "haiku",
      "subagent",
      "useDefaultForAllModels",
      "maxEffort",
      "disableClaudeAttribution",
      "disableNonessentialTraffic",
      "permissionDefaultMode",
      "enableAutoTheme"
    ];
    const el = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
    const providerList = document.getElementById("providerList");
    const envRows = document.getElementById("envRows");
    const statusEl = document.getElementById("status");

    window.addEventListener("message", (event) => {
      const message = event.data;
      if (message.type === "state") {
        state = message.payload;
        activeProvider = state.activeProvider || state.presets[0].id;
        render();
      }
      if (message.type === "error") {
        setStatus(message.payload || "", false);
      }
      if (message.type === "token" && message.payload?.providerId === activeProvider) {
        el.authToken.value = message.payload.token || "";
        tokenVisible = true;
        el.authToken.type = "text";
        syncTokenToggle();
        baseline = serializeConfig(collectConfig());
        updateDirty();
      }
    });

    document.getElementById("save").addEventListener("click", () => post("saveConfig", collectConfig()));
    document.getElementById("apply").addEventListener("click", () => post("applyConfig", collectConfig()));
    document.getElementById("addProvider").addEventListener("click", () => post("addProvider", {}));
    document.getElementById("deleteProvider").addEventListener("click", () => post("deleteProvider", { providerId: activeProvider }));
    document.getElementById("reset").addEventListener("click", () => post("resetProvider", { providerId: activeProvider }));
    document.getElementById("openSettings").addEventListener("click", () => post("openSettings", {}));
    document.getElementById("addEnv").addEventListener("click", () => {
      addEnvRow("", "");
      updateDirty();
    });
    document.getElementById("toggleToken").addEventListener("click", () => {
      if (!el.authToken.value) {
        if (state.tokenStatus?.[activeProvider]) {
          post("revealToken", { providerId: activeProvider });
        }
        return;
      }
      tokenVisible = !tokenVisible;
      el.authToken.type = tokenVisible ? "text" : "password";
      syncTokenToggle();
    });
    el.authToken.addEventListener("input", syncTokenToggle);

    for (const item of ids) {
      el[item].addEventListener("input", updateDirty);
      el[item].addEventListener("change", updateDirty);
    }

    post("ready", {});

    function render() {
      isRendering = true;
      renderProviders();
      const config = currentConfig();
      const provider = currentProvider();
      const tokenSaved = Boolean(state.tokenStatus?.[activeProvider]);
      document.getElementById("tokenStatus").textContent = tokenSaved ? messages.tokenSaved : messages.tokenUnsaved;
      document.getElementById("reset").disabled = !provider.isBuiltin;
      document.getElementById("deleteProvider").disabled = provider.isBuiltin;

      el.displayName.value = config.displayName || provider.name || "";
      el.baseUrl.value = config.baseUrl || "";
      el.authToken.value = "";
      el.authToken.placeholder = tokenSaved ? savedTokenMask : messages.tokenPlaceholder;
      tokenVisible = false;
      el.authToken.type = "password";
      syncTokenToggle();
      el.model.value = config.models?.model || "";
      el.opus.value = config.models?.opus || "";
      el.sonnet.value = config.models?.sonnet || "";
      el.haiku.value = config.models?.haiku || "";
      el.subagent.value = config.models?.subagent || "";
      el.useDefaultForAllModels.checked = allModelSlotsMatch(config.models || {});
      el.maxEffort.checked = Boolean(config.maxEffort);
      el.disableClaudeAttribution.checked = config.disableClaudeAttribution !== false;
      el.disableNonessentialTraffic.checked = config.disableNonessentialTraffic !== false;
      el.permissionDefaultMode.value = permissionDefaultModeFromConfig(config);
      el.enableAutoTheme.checked = config.enableAutoTheme !== false;
      renderEnvRows(config.customEnv || {});
      document.getElementById("settingsPath").textContent = state.settingsPath || "";
      document.getElementById("preview").textContent = state.settingsError || state.settingsPreview || "{}";
      baseline = serializeConfig(collectConfig());
      setStatus(state.status || "", false);
      isRendering = false;
    }

    function renderProviders() {
      providerList.innerHTML = "";
      for (const provider of state.providers || []) {
        const button = document.createElement("button");
        button.className = "provider-card" + (provider.id === activeProvider ? " active" : "");
        button.type = "button";
        button.innerHTML =
          "<span class='provider-main'>" +
            "<span class='provider-name'><span class='truncate'>" + escapeHtml(provider.name) + "</span>" + providerBadge(provider.id) + "</span>" +
            "<span class='provider-url'>" + escapeHtml(formatProviderUrl(provider.baseUrl)) + "</span>" +
          "</span>";
        button.addEventListener("click", () => {
          activeProvider = provider.id;
          render();
        });
        providerList.appendChild(button);
      }
    }

    function providerBadge(providerId) {
      if (providerId === state.appliedProvider) {
        return "<span class='pill applied'>" + escapeHtml(messages.applied) + "</span>";
      }
      if (providerId === activeProvider) {
        return "<span class='pill pending'>" + escapeHtml(messages.pending) + "</span>";
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
      for (const entry of entries) {
        addEnvRow(entry[0], entry[1]);
      }
    }

    function addEnvRow(key, value) {
      const row = document.createElement("div");
      row.className = "env-row";
      row.innerHTML = "<input class='env-key'><input class='env-value'><button class='icon' type='button'>x</button>";
      row.querySelector(".env-key").placeholder = messages.envKeyPlaceholder;
      row.querySelector(".env-value").placeholder = messages.envValuePlaceholder;
      row.querySelector("button").title = messages.deleteEnv;
      row.querySelector(".env-key").value = key;
      row.querySelector(".env-value").value = value;
      row.querySelector(".env-key").addEventListener("input", updateDirty);
      row.querySelector(".env-value").addEventListener("input", updateDirty);
      row.querySelector("button").addEventListener("click", () => {
        row.remove();
        updateDirty();
      });
      envRows.appendChild(row);
    }

    function collectConfig() {
      const defaultModel = el.model.value;
      const useDefaultForAllModels = el.useDefaultForAllModels.checked;
      return {
        providerId: activeProvider,
        displayName: el.displayName.value,
        baseUrl: el.baseUrl.value,
        authToken: el.authToken.value,
        models: {
          model: defaultModel,
          opus: useDefaultForAllModels ? defaultModel : el.opus.value,
          sonnet: useDefaultForAllModels ? defaultModel : el.sonnet.value,
          haiku: useDefaultForAllModels ? defaultModel : el.haiku.value,
          subagent: useDefaultForAllModels ? defaultModel : el.subagent.value
        },
        customEnv: collectEnv(),
        maxEffort: el.maxEffort.checked,
        disableClaudeAttribution: el.disableClaudeAttribution.checked,
        disableNonessentialTraffic: el.disableNonessentialTraffic.checked,
        permissionDefaultMode: el.permissionDefaultMode.value,
        enableAutoTheme: el.enableAutoTheme.checked
      };
    }

    function permissionDefaultModeFromConfig(config) {
      if (["none", "auto", "bypassPermissions"].includes(config.permissionDefaultMode)) {
        return config.permissionDefaultMode;
      }
      return config.enableAutoMode === true ? "auto" : "none";
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

    function updateDirty() {
      if (isRendering) {
        return;
      }
      const dirty = serializeConfig(collectConfig()) !== baseline;
      setStatus(dirty ? messages.unsavedChanges : state.status || "", dirty);
    }

    function syncTokenToggle() {
      const toggle = document.getElementById("toggleToken");
      toggle.disabled = !el.authToken.value && !state.tokenStatus?.[activeProvider];
      toggle.textContent = tokenVisible ? messages.tokenHide : messages.tokenShow;
    }

    function setStatus(text, dirty) {
      statusEl.textContent = text;
      statusEl.className = "status" + (dirty ? " dirty" : "");
    }

    function allModelSlotsMatch(models) {
      const model = models.model || "";
      return Boolean(model) &&
        (models.opus || "") === model &&
        (models.sonnet || "") === model &&
        (models.haiku || "") === model &&
        (models.subagent || "") === model;
    }

    function currentProvider() {
      return (state.providers || []).find((provider) => provider.id === activeProvider) || state.providers[0] || {};
    }

    function currentConfig() {
      return state.configs?.[activeProvider] || {};
    }

    function formatProviderUrl(value) {
      try {
        const url = new URL(value);
        return url.host + url.pathname.replace(/\\/$/, "");
      } catch {
        return value || "";
      }
    }

    function serializeConfig(config) {
      return JSON.stringify(config);
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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char] ?? char);
}

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 32; i += 1) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

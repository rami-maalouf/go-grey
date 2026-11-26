if (typeof importScripts === "function") importScripts("sites.js");

const api = globalThis.browser ?? chrome;
const alarm = "resume";
const tabKey = (id) => "tab-" + id;
let queue = Promise.resolve();

function ordered(work) {
  const result = queue.then(work);
  queue = result.catch(console.error);
  return result;
}

function scopeFor(url, site) {
  return site ?? (hostnameOf(url) ? new URL(url).origin : null);
}

async function state(tabId, url, custom) {
  const site = siteFor(url, custom);
  const scope = scopeFor(url, site);
  const { enabled = {}, until = 0 } = await api.storage.local.get([
    "enabled",
    "until",
  ]);
  const key = tabKey(tabId);
  const entry = (await api.storage.session.get(key))[key];
  const mode = scope && entry?.site === scope ? entry.mode : "auto";
  const paused = until > Date.now();
  const gray = Boolean(
    !paused &&
    (mode === "auto" ? site && enabled[site] !== false : mode === "gray"),
  );
  return { site, scope, enabled, mode, until: paused ? until : 0, gray };
}

async function refresh(custom, clearUnlisted = false) {
  const overrides = await api.storage.session.get(null);
  const tabs = await api.tabs.query({});
  await Promise.all(
    tabs
      .filter(
        (tab) =>
          clearUnlisted ||
          overrides[tabKey(tab.id)] ||
          siteFor(tab.url, custom),
      )
      .map((tab) => paintTab(tab, custom)),
  );
}

async function paintTab(tab, custom) {
  const current = await state(tab.id, tab.url, custom);
  await api.tabs
    .sendMessage(
      tab.id,
      {
        type: "paint",
        hostname: hostnameOf(tab.url),
        gray: current.gray,
      },
      { frameId: 0 },
    )
    .catch(() => {});
}

function attach(tabId) {
  return api.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
    injectImmediately: true,
  });
}

async function handle(msg, sender) {
  const { custom = [] } = await api.storage.local.get("custom");
  if (msg.type === "load") {
    const { gray } = await state(sender.tab?.id, sender.url, custom);
    return { gray };
  }
  if (sender.url?.split("?")[0] === api.runtime.getURL("manage.html")) {
    return manage(msg, custom);
  }
  if (sender.url !== api.runtime.getURL("popup.html")) return;
  const tab = await api.tabs.get(msg.tabId);
  const site = siteFor(tab.url, custom);
  const popupState = async () => ({
    ...(await state(tab.id, tab.url, custom)),
    custom,
    hostname: hostnameOf(tab.url),
  });
  switch (msg.type) {
    case "read":
      return popupState();
    case "site": {
      if (
        (!custom.includes(msg.site) &&
          !sites.some((s) => s.name === msg.site)) ||
        typeof msg.on !== "boolean"
      )
        return;
      const { enabled = {} } = await api.storage.local.get("enabled");
      await api.storage.local.set({
        enabled: { ...enabled, [msg.site]: msg.on },
      });
      break;
    }
    case "mode": {
      if (
        !msg.scope ||
        scopeFor(tab.url, site) !== msg.scope ||
        !["auto", "gray", "color"].includes(msg.mode)
      )
        return popupState();
      const key = tabKey(tab.id);
      try {
        await attach(tab.id);
      } catch {
        return { error: "Your browser blocked access to this page." };
      }
      if (msg.mode === "auto") await api.storage.session.remove(key);
      else
        await api.storage.session.set({
          [key]: { site: msg.scope, mode: msg.mode },
        });
      await paintTab(tab, custom);
      return popupState();
    }
    case "pause": {
      if (![0, 2, 5, 10].includes(msg.minutes)) return;
      const until = msg.minutes ? Date.now() + msg.minutes * 60000 : 0;
      if (until) await api.alarms.create(alarm, { when: until });
      else await api.alarms.clear(alarm);
      await api.storage.local.set({ until });
      break;
    }
    default:
      return;
  }
  await refresh(custom);
  return popupState();
}

api.runtime.onMessage.addListener((msg, sender, reply) => {
  ordered(() => handle(msg, sender)).then(reply, () => reply({ error: true }));
  return true;
});
api.tabs.onRemoved.addListener((id) =>
  ordered(() => api.storage.session.remove(tabKey(id))),
);
async function reconcile() {
  const { until = 0 } = await api.storage.local.get("until");
  if (until > Date.now()) await api.alarms.create(alarm, { when: until });
  else await api.storage.local.remove("until");
  await syncCustom();
}
api.alarms.onAlarm.addListener((event) => {
  if (event.name === alarm) ordered(reconcile);
});
api.runtime.onStartup.addListener(() => ordered(reconcile));

async function register(custom) {
  const id = "custom-sites";
  const matches = custom.map(originFor);
  const [previous] = await api.scripting.getRegisteredContentScripts({
    ids: [id],
  });
  if (!matches.length) {
    if (previous) await api.scripting.unregisterContentScripts({ ids: [id] });
  } else if (previous) {
    await api.scripting.updateContentScripts([{ id, matches }]);
  } else {
    await api.scripting.registerContentScripts([
      { id, matches, js: ["content.js"], runAt: "document_start" },
    ]);
  }
}

async function syncCustom() {
  const { custom = [] } = await api.storage.local.get("custom");
  const allowed = await Promise.all(
    custom.map((domain) =>
      api.permissions.contains({ origins: [originFor(domain)] }),
    ),
  );
  const kept = custom.filter((_, i) => allowed[i]);
  if (kept.length !== custom.length)
    await api.storage.local.set({ custom: kept });
  await register(kept);
  await refresh(kept, kept.length !== custom.length);
}

async function manage(msg, custom) {
  if (msg.type === "list") return { custom };
  const domain = domainInput(msg.domain);
  if (domain !== msg.domain || siteFor("https://" + domain))
    throw Error("Invalid custom domain");
  const origins = [originFor(domain)];
  if (msg.type === "add") {
    if (!(await api.permissions.contains({ origins })))
      throw Error("Site access required");
    const next = [...new Set([...custom, domain])].sort();
    await register(next);
    await api.storage.local.set({ custom: next });
    // existing documents did not receive the new registration at document start.
    const tabs = await api.tabs.query({ url: origins });
    await Promise.all(
      tabs.map((tab) =>
        api.scripting
          .executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
            injectImmediately: true,
          })
          .catch(() => {}),
      ),
    );
    await refresh(next);
    return { custom: next };
  }
  if (msg.type === "remove" && custom.includes(domain)) {
    const next = custom.filter((host) => host !== domain);
    await register(next);
    const { enabled = {} } = await api.storage.local.get("enabled");
    delete enabled[domain];
    await api.storage.local.set({ custom: next, enabled });
    const overrides = await api.storage.session.get(null);
    const keys = Object.keys(overrides).filter(
      (key) => overrides[key]?.site === domain,
    );
    if (keys.length) await api.storage.session.remove(keys);
    await refresh(next, true);
    await api.permissions.remove({ origins });
    return { custom: next };
  }
  throw Error("Unknown site action");
}
api.permissions.onRemoved.addListener(() => ordered(syncCustom));
api.runtime.onInstalled.addListener(() => ordered(syncCustom));

// unlisted sites have a temporary tab grant and no registered content script.
api.tabs.onUpdated.addListener((id, change, tab) => {
  if (change.status !== "complete") return;
  ordered(async () => {
    const key = tabKey(id);
    const entry = (await api.storage.session.get(key))[key];
    if (!entry?.site?.includes("://")) return;
    if (!hostnameOf(tab.url) || new URL(tab.url).origin !== entry.site) {
      await api.storage.session.remove(key);
      return;
    }
    await attach(id).catch(() => {});
  });
});

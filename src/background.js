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

async function state(tabId, site) {
  const { enabled = {}, until = 0 } = await api.storage.local.get([
    "enabled",
    "until",
  ]);
  const key = tabKey(tabId);
  const entry = (await api.storage.session.get(key))[key];
  const mode = site && entry?.site === site ? entry.mode : "auto";
  const paused = until > Date.now();
  const gray = Boolean(
    site &&
    !paused &&
    (mode === "auto" ? enabled[site] !== false : mode === "gray"),
  );
  return { site, enabled, mode, until: paused ? until : 0, gray };
}

async function refresh() {
  const tabs = await api.tabs.query({
    url: sites.flatMap((s) => s.domains.map((d) => "https://*." + d + "/*")),
  });
  await Promise.all(
    tabs.map(async (tab) => {
      const current = await state(tab.id, siteFor(tab.url));
      await api.tabs
        .sendMessage(
          tab.id,
          { type: "paint", site: current.site, gray: current.gray },
          { frameId: 0 },
        )
        .catch(() => {});
    }),
  );
}

async function handle(msg, sender) {
  if (msg.type === "load") return state(sender.tab?.id, siteFor(sender.url));
  if (sender.url !== api.runtime.getURL("popup.html")) return;
  const tab = await api.tabs.get(msg.tabId);
  const site = siteFor(tab.url);
  switch (msg.type) {
    case "read":
      return state(tab.id, site);
    case "site": {
      if (
        !sites.some((s) => s.name === msg.site) ||
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
        !site ||
        site !== msg.site ||
        !["auto", "gray", "color"].includes(msg.mode)
      )
        return state(tab.id, site);
      const key = tabKey(tab.id);
      if (msg.mode === "auto") await api.storage.session.remove(key);
      else await api.storage.session.set({ [key]: { site, mode: msg.mode } });
      break;
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
  await refresh();
  return state(tab.id, site);
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
  await refresh();
}
api.alarms.onAlarm.addListener((event) => {
  if (event.name === alarm) ordered(reconcile);
});
api.runtime.onStartup.addListener(() => ordered(reconcile));

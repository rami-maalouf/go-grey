const api = globalThis.browser ?? chrome;
const el = (id) => document.getElementById(id);
let tabId, current, timer;
async function send(type, data = {}) {
  try {
    const state = await api.runtime.sendMessage({ type, tabId, ...data });
    if (!state || state.error)
      throw Error(
        typeof state?.error === "string"
          ? state.error
          : "Couldn’t update this tab. Try reopening Stillfeed.",
      );
    el("error").hidden = true;
    current = state;
    render();
  } catch (error) {
    el("error").hidden = false;
    el("error").textContent = error.message;
  }
}
function button(parent, title, action) {
  const node = document.createElement("button");
  node.textContent = title;
  node.onclick = action;
  el(parent).append(node);
  return node;
}
const modes = Object.entries({
  auto: "Use site default",
  gray: "Grayscale",
  color: "Full color",
}).map(([mode, title]) => [
  mode,
  button("modes", title, () => send("mode", { mode, scope: current.scope })),
]);
const switches = new Map();
function updateSites(custom) {
  const names = new Set([...sites.map((s) => s.name), ...custom]);
  for (const [name, input] of switches) {
    if (!names.has(name)) {
      input.parentElement.remove();
      switches.delete(name);
    }
  }
  for (const name of names) {
    if (switches.has(name)) continue;
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.onchange = () => send("site", { site: name, on: input.checked });
    label.append(name, input);
    el("sites").append(label);
    switches.set(name, input);
  }
}
el("addSite").onclick = async () => {
  const domain = current.hostname.replace(/^www\./, "");
  el("addSite").disabled = true;
  try {
    // start both calls during the click so the browser receives the user gesture.
    const pending = api.runtime.sendMessage({
      type: "prepareAdd",
      tabId,
      domain,
    });
    const [result, allowed] = await Promise.all([
      pending,
      api.permissions.request({ origins: [originFor(domain)] }),
    ]);
    if (!allowed) {
      await send("cancelAdd", { domain });
      throw Error("Site access was declined. You can try again anytime.");
    }
    if (result?.error || !result)
      throw Error("Couldn’t add this site. Try reopening Stillfeed.");
    await send("read");
  } catch (error) {
    el("error").textContent = error.message;
    el("error").hidden = false;
  } finally {
    el("addSite").disabled = false;
  }
};
api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.custom && tabId != null) send("read");
});
el("manage").onclick = () => {
  const domain = current?.site
    ? ""
    : current?.hostname?.replace(/^www\./, "") || "";
  api.tabs.create({
    url:
      api.runtime.getURL("manage.html") +
      (domain ? "?domain=" + encodeURIComponent(domain) : ""),
  });
};
for (const minutes of [2, 5, 10])
  button("times", minutes + " min", () => send("pause", { minutes }));
el("resume").onclick = () => send("pause", { minutes: 0 });
function render() {
  const { site, gray, mode, enabled, until } = current;
  clearTimeout(timer);
  el("context").textContent = current.hostname
    ? "This tab · " + current.hostname
    : "This tab";
  el("status").textContent = current.scope
    ? gray
      ? "Grayscale"
      : "Full color"
    : "Browser page";
  el("modes").hidden = !current.scope;
  el("hint").textContent = !current.scope
    ? "Open Stillfeed on a website to change its colors."
    : until
      ? "Grayscale is paused. Resume below to change this tab."
      : "Site default: " +
        (site && enabled[site] !== false ? "grayscale" : "full color") +
        ". Changes here apply only to this tab.";
  modes.forEach(([value, node]) => {
    node.disabled = Boolean(until);
    node.setAttribute("aria-pressed", String(value === mode));
  });
  el("addSite").hidden = !current.hostname || Boolean(site);
  el("addSite").textContent = "Add " + current.hostname.replace(/^www\./, "");
  updateSites(current.custom);
  switches.forEach((input, name) => {
    input.checked = enabled[name] !== false;
  });
  el("pauseTitle").textContent = until
    ? "Paused until " +
      new Date(until).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "Pause all sites";
  el("times").hidden = !!until;
  el("resume").hidden = !until;
  if (until)
    timer = setTimeout(
      () => send("read"),
      Math.max(0, until - Date.now()) + 50,
    );
}
api.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  tabId = tab.id;
  send("read");
});

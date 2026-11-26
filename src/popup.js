const api = globalThis.browser ?? chrome;
const el = (id) => document.getElementById(id);
let tabId, current, timer;
async function send(type, data = {}) {
  try {
    const state = await api.runtime.sendMessage({ type, tabId, ...data });
    if (!state || state.error) throw Error();
    current = state;
    render();
  } catch {
    el("error").hidden = false;
    el("error").textContent =
      "Couldn’t update this tab. Reopen Stillfeed to try again.";
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
  auto: "Site setting",
  gray: "Grayscale",
  color: "Color",
}).map(([mode, title]) => [
  mode,
  button("modes", title, () => send("mode", { mode, site: current.site })),
]);
const switches = sites.map(({ name }) => {
  const label = document.createElement("label");
  const input = document.createElement("input");
  input.type = "checkbox";
  input.onchange = () => send("site", { site: name, on: input.checked });
  label.append(name, input);
  el("sites").append(label);
  return [name, input];
});
for (const minutes of [2, 5, 10])
  button("times", minutes + " min", () => send("pause", { minutes }));
el("resume").onclick = () => send("pause", { minutes: 0 });
function render() {
  const { site, gray, mode, enabled, until } = current;
  clearTimeout(timer);
  el("context").textContent = site ? site + " · This tab" : "This tab";
  el("status").textContent = site
    ? gray
      ? "Grayscale"
      : "Full color"
    : "Outside your sites";
  el("modes").hidden = !site || !!until;
  modes.forEach(([value, node]) =>
    node.setAttribute("aria-pressed", String(value === mode)),
  );
  switches.forEach(([name, input]) => {
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

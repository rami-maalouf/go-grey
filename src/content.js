(() => {
  const api = globalThis.browser ?? chrome;
  const site = siteFor(location.href);
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(
    ":root, :fullscreen, :modal, :popover-open { filter: grayscale(1) !important; }",
  );
  function paint(gray) {
    const sheets = document.adoptedStyleSheets;
    if (gray && !sheets.includes(sheet)) sheets.push(sheet);
    if (!gray && sheets.includes(sheet))
      sheets.splice(sheets.indexOf(sheet), 1);
  }
  let revision = 0;
  function load() {
    const ticket = ++revision;
    api.runtime
      .sendMessage({ type: "load" })
      .then((state) => {
        if (ticket === revision && state && !state.error) paint(state.gray);
      })
      .catch(() => {});
  }
  api.runtime.onMessage.addListener((msg) => {
    if (msg.type === "paint" && msg.site === site) {
      revision++;
      paint(msg.gray);
    }
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) load();
  });
  load();
})();

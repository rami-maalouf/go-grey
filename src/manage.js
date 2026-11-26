const api = globalThis.browser ?? chrome;
const input = document.getElementById("domain");
const feedback = document.getElementById("feedback");
const list = document.getElementById("custom");
let domains = [];
async function change(type, domain) {
  const result = await api.runtime.sendMessage({ type, domain });
  if (!result || result.error)
    throw Error("Couldn’t update your sites. Please try again.");
  domains = result.custom;
  list.replaceChildren();
  document.getElementById("empty").hidden = !!domains.length;
  for (const name of domains) {
    const row = document.createElement("li");
    const remove = document.createElement("button");
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", "Remove " + name);
    remove.onclick = async () => {
      try {
        await change("remove", name);
        feedback.textContent = name + " removed.";
      } catch (error) {
        feedback.textContent = error.message;
      }
    };
    row.append(name, remove);
    list.append(row);
  }
}
input.value = new URLSearchParams(location.search).get("domain") ?? "";
document.querySelector("form").onsubmit = async (event) => {
  event.preventDefault();
  try {
    const domain = domainInput(input.value);
    if (siteFor("https://" + domain, domains))
      throw Error("This website is already included.");
    if (!(await api.permissions.request({ origins: [originFor(domain)] })))
      throw Error("Site access was declined. You can try again anytime.");
    await change("add", domain);
    input.value = "";
    feedback.textContent = domain + " added.";
  } catch (error) {
    feedback.textContent =
      error instanceof TypeError
        ? "Enter a valid website address."
        : error.message;
  }
};
api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.custom)
    change("list").catch((error) => {
      feedback.textContent = error.message;
    });
});
change("list").catch((error) => {
  feedback.textContent = error.message;
});

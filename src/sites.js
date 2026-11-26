const sites = [
  { name: "Instagram", domains: ["instagram.com"] },
  { name: "X", domains: ["x.com", "twitter.com"] },
  { name: "LinkedIn", domains: ["linkedin.com"] },
];

function hostnameOf(url) {
  try {
    const parsed = new URL(url);
    if (["http:", "https:"].includes(parsed.protocol))
      return parsed.hostname.replace(/\.$/, "");
  } catch {}
  return "";
}

function siteFor(url, custom = []) {
  const host = hostnameOf(url);
  const matches = (domain) => host === domain || host.endsWith("." + domain);
  return (
    sites.find((s) => s.domains.some(matches))?.name ??
    custom.filter(matches).sort((a, b) => b.length - a.length)[0] ??
    null
  );
}

function domainInput(value) {
  const text = value.trim();
  if (!text || /[\s\\]/.test(text))
    throw Error("Enter a domain or an HTTP or HTTPS address.");
  const url = new URL(text.includes("://") ? text : "https://" + text);
  const host = hostnameOf(url.href);
  if (
    !host ||
    host.includes("*") ||
    url.username ||
    url.password ||
    host.split(".").some((label) => !label)
  ) {
    throw Error("Enter a full domain, such as youtube.com.");
  }
  return host;
}

function originFor(host) {
  const exact =
    !host.includes(".") || host.startsWith("[") || /^[\d.]+$/.test(host);
  return "*://" + (exact ? "" : "*.") + host + "/*";
}

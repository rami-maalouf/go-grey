const sites = [
  { name: "Instagram", domains: ["instagram.com"] },
  { name: "X", domains: ["x.com", "twitter.com"] },
  { name: "LinkedIn", domains: ["linkedin.com"] },
];

function siteFor(url) {
  if (!url) return null;
  const { hostname, protocol } = new URL(url);
  if (protocol !== "https:") return null;
  return (
    sites.find((site) =>
      site.domains.some(
        (domain) => hostname === domain || hostname.endsWith("." + domain),
      ),
    )?.name ?? null
  );
}

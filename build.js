import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { $ } from "bun";
import vm from "node:vm";
const matches = vm.runInNewContext(
  (await Bun.file("src/sites.js").text()) +
    '\nsites.flatMap(site => site.domains.map(domain => "https://*." + domain + "/*"))',
);
const icons = Object.fromEntries(
  [16, 32, 48, 96, 128].map((size) => [size, "icons/" + size + ".png"]),
);
for (const target of ["chrome", "firefox"]) {
  const dir = "dist/" + target;
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await cp("src", dir, { recursive: true });
  const manifest = {
    manifest_version: 3,
    name: "Stillfeed",
    version: "1.0.0",
    description:
      "Turn Instagram, X, and LinkedIn grayscale, including videos. Pause for a few minutes or keep a single tab in color.",
    permissions: ["storage", "alarms"],
    host_permissions: matches,
    icons,
    action: {
      default_popup: "popup.html",
      default_icon: icons,
      default_title: "Stillfeed",
    },
    content_scripts: [
      { matches, js: ["sites.js", "content.js"], run_at: "document_start" },
    ],
    ...(target === "chrome"
      ? {
          minimum_chrome_version: "123",
          background: { service_worker: "background.js" },
        }
      : {
          background: { scripts: ["sites.js", "background.js"] },
          browser_specific_settings: {
            gecko: {
              id: "stillfeed@ramimaalouf.com",
              strict_min_version: "142.0",
              data_collection_permissions: { required: ["none"] },
            },
          },
        }),
  };
  await writeFile(
    dir + "/manifest.json",
    JSON.stringify(manifest, null, 2) + "\n",
  );
  const archive = "stillfeed-" + target + "-1.0.0.zip";
  await rm("dist/" + archive, { force: true });
  await $`zip -Xqr ${"../" + archive} .`.cwd(dir);
}

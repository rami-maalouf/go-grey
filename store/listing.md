# Go Gray

## Short description

Turn chosen websites grayscale, including videos. Keep one tab in color or pause grayscale for a few minutes.

## Store description

Go Gray turns Instagram, X, and LinkedIn grayscale when you visit them. Photos, posts, and videos playing on the page all lose their color together.

To add YouTube, Reddit, or another website, open Go Gray and click Add next to the domain name. You can also type an address in Manage sites. A site setting covers its subdomains and takes effect across open tabs.

Need color to edit a photo or read a chart? Switch off Grayscale this tab. Other tabs keep their own settings. The same switch can turn a single tab gray on a site you usually keep in color. Choose Use site default to reset the tab.

Pause all sites for 2, 5, or 10 minutes. Color returns immediately and grayscale resumes when the timer ends. Your selections stay in the browser. Go Gray has no account, analytics, or external services.

## Listing fields

| Field | Value |
| --- | --- |
| Product | Go Gray |
| Language and platform | English, desktop |
| Chrome category | Workflow & Planning |
| Firefox category | Appearance |
| Homepage | https://rami-maalouf.github.io/go-grey/ |
| Support | https://github.com/rami-maalouf/go-grey/issues |
| Privacy policy | https://rami-maalouf.github.io/go-grey/privacy.html |
| Store icon | `src/icons/128.png`, 128 × 128 PNG |
| Screenshot | `store/screenshot.png`, 1280 × 800 PNG |
| Chrome small promo tile | `store/promo.png`, 440 × 280 PNG |

## Privacy and permission disclosures

**Single purpose.** Apply a user-controlled grayscale display filter to selected websites and tabs.

| Permission | Reason |
| --- | --- |
| storage | Save enabled sites, custom domains, and pause deadlines on-device. Keep per-tab choices in session storage. |
| alarms | Restore the user's settings when a timed pause expires, including when the background worker had been idle. |
| activeTab | Identify the current site when the user opens the popup and allow an explicit tab-only change on an unlisted site. |
| scripting | Register the local filter script on newly approved domains and apply it immediately in open tabs. |
| Required host access | Apply the filter on Instagram, LinkedIn, X, and the former Twitter domain, including their subdomains. |
| Optional host access | Request the individual domain the user adds. Its HTTP and HTTPS pages and subdomains can then use the filter. |

The package contains all executable code. It requests no remote code and collects or transmits no user data. The Firefox manifest declares `data_collection_permissions.required` as `["none"]`. No account or test credentials are required.

## Reviewer steps

1. Open Instagram, X, or LinkedIn in two tabs. Reload a site if it was already open during installation. Its photos and in-page videos should render in grayscale.
2. Switch off **Grayscale this tab** in one tab. Verify that colors return there and the second tab stays gray. Choose **Use site default** to reset the tab.
3. Open a video on YouTube. From the popup, select **Add youtube.com** and grant the requested domain access. Compare the video in color and grayscale using the tab switch. **Manage sites** lets you remove the domain.
4. Select **2 min** under **Pause all sites**. Color returns in both tabs. Leave them open and check that grayscale resumes when the timer expires. A second pause can be ended early with **Resume grayscale**.

## Upload

Build from the release source with `bun build.js`. Upload the Chrome ZIP to the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole/) and the Firefox ZIP to the [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/). For public Firefox distribution, select **On this site**. Use the listed images and privacy URL, and complete the publisher's account, distribution, license, and certification fields in the dashboards.

The distributed scripts are copied directly from `src/` and are human-readable. If a source archive is requested, supply the GitHub source ZIP for the exact release tag. Its README includes the one-command build, which needs Bun and the zip CLI. Mozilla signs the Firefox package after acceptance.

[Chrome listing guide](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) · [Mozilla submission guide](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/) · [Mozilla source requirements](https://extensionworkshop.com/documentation/publish/source-code-submission/)

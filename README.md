# Go Grey

Turn the websites you choose grayscale, including their photos and in-page videos. Instagram, X (including twitter.com), and LinkedIn start enabled. Add YouTube or any other regular website from the toolbar. Everything runs locally.

[Website](https://rami-maalouf.github.io/go-grey/) · [Release downloads](https://github.com/rami-maalouf/go-grey/releases) · [Privacy](https://rami-maalouf.github.io/go-grey/privacy.html)

## Using Go Grey

Open the toolbar popup and click **Add [domain]** to add the website you're visiting. Grant site access if the browser asks. **Manage sites** lets you type a different address or remove an added site. Domains include their subdomains. With the site list in the popup, you can change a site's default across open tabs.

**Grayscale this tab** lets you keep one tab in color while the rest of that site stays gray. It also lets you turn a single tab gray on an unlisted site. **Use site default** clears that choice. **Pause all sites** restores color everywhere for 2, 5, or 10 minutes. Choose **Resume grayscale** to end a pause early.

The browser applies a CSS filter to the document, including in-page video and fullscreen content. There is no frame-by-frame processing, DOM scanning, or polling. Separate picture-in-picture windows, external players, and browser-protected pages are outside the page filter.

## Build and try it

From the repository root, run `bun build.js` with Bun and the `zip` command installed. No dependency installation is necessary. The build generates the two browser manifests, copies the readable HTML, CSS, JavaScript, and icons into separate directories, then creates one ZIP per browser.

| Browser | Local installation |
| --- | --- |
| Chrome 123+ | Open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose `dist/chrome/`. |
| Firefox 142+ or compatible Zen | Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `dist/firefox/manifest.json`. The temporary installation ends when you restart the browser. |

For a release ZIP, extract it first and use the extracted folder in place of the build directory above. An ordinary persistent Firefox or Zen installation requires a Mozilla-signed build. Reload any site that was already open during installation.

## Store submission

The build produces `dist/go-grey-chrome-1.4.4.zip` and `dist/go-grey-firefox-1.4.4.zip`. Both have their browser-specific `manifest.json` at the archive root. The submission kit includes listing copy, URLs, permission explanations, review steps, and image filenames. [Store submission kit](store/listing.md)

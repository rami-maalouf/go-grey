# Stillfeed

A desktop browser extension for viewing Instagram, X (including twitter.com), and LinkedIn in grayscale. Each site starts enabled. The popup can override the site preference for an individual tab. A timed pause takes priority over both settings.

## Build and try it

Run `bun build.js` in this directory. The build copies readable JavaScript, CSS, HTML, and icons directly into the browser-specific packages under `dist/`. It requires Bun and the zip CLI.

In Chrome, visit `chrome://extensions`, enable Developer mode, select Load unpacked, and choose `dist/chrome`. In Firefox or Zen, visit `about:debugging#/runtime/this-firefox`, choose Load Temporary Add-on, and select `dist/firefox/manifest.json`. Reload supported pages already open at installation.

The content script applies a CSS grayscale filter to the document and top-layer elements. It requires no DOM scanning, playback hooks, or continuous JavaScript. The browser still incurs rendering costs for the filter. Separate picture-in-picture windows and external players are outside the page filter.

## Submission

Upload the corresponding ZIP from `dist/` to the Chrome Web Store developer dashboard or Firefox Add-on Developer Hub. The Firefox build is unsigned until Mozilla signs it. Use the description, permission explanations, and reviewer instructions in `store/listing.md`, the screenshot and promotional tile in `store/`, and the 128-pixel icon in `src/icons/`. Privacy text for your publisher website is in `store/privacy.md`. Select desktop distribution. Complete account-specific publisher details and certifications in each dashboard.

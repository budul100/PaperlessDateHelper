# Paperless Date Helper

## Overview

Paperless Date Helper is a Firefox extension for Paperless-ngx that enhances the document date workflow in two ways:
* It displays clickable date pills next to every date input field, so you can apply a suggested date with a single click instead of typing it manually.
* Optionally, it adds an alternative interpretation for ambiguous dates --- useful when your document archive contains both European (DD.MM.YYYY) and American (MM.DD.YYYY) documents.

## Requirements

Firefox 140.0 or later. No other dependencies or server-side components.

Installation

1) Open Firefox and navigate to about:debugging.

2) Click "This Firefox" in the left sidebar.

3) Click "Load Temporary Add-on\..." and select the manifest.json file from the extension directory.

4) The extension is now active and will inject into all pages. It is effective only on Paperless-ngx instances.

For a permanent installation, the extension must be signed by Mozilla or loaded via an enterprise policy.

## Configuration

Open the extension's options page via the Firefox Add-ons Manager (about:addons → Paperless Date Helper → Preferences).

  ----------------- --------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Setting**       **Default**     **Description**
  suggestionLabel   „Vorschläge:"   Label string used to identify suggestion blocks in the Paperless-ngx DOM. Must match the label rendered by your Paperless-ngx language. Common values: „Vorschläge:" (German), „Suggestions:" (English).
  flipDates         false           Show ambiguous dates in reversed order (MM/DD ↔ DD/MM).
  ----------------- --------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Settings are stored via the browser's sync storage and persist across sessions.

## Supported Date Format

The extension recognises dates in the format DD.MM.YYYY only. Other formats (ISO, slash-separated, etc.) are not parsed and are passed through unchanged.

File Structure

  --------------- -------------------------------------------------------------------------------------------
  **File**        **Purpose**
  manifest.json   Extension manifest (Manifest V3). Declares permissions, content script, and options page.
  content.js      Main logic. Injected into all pages. Detects, augments, and injects suggestion blocks.
  options.html    Options page UI.
  options.js      Loads and saves settings via browser.storage.sync.
  --------------- -------------------------------------------------------------------------------------------

## How It Works

The extension injects a content script into every page. On each DOM mutation, it runs three steps:

1) Augment existing blocks. Every \<small\> element whose label span matches the configured suggestion label is processed. The existing date links are collected, deduplicated, and extended with flip-date alternatives if enabled. The block is then rebuilt with fresh clickable pills.

2) Collect global dates. All dates from processed suggestion blocks are aggregated into a shared set.

3) Inject into custom fields. Every pngx-input-date component that does not already have a suggestion block receives a newly created one containing all globally collected dates.

Clicking a pill uses the native HTMLInputElement value setter and dispatches input and change events so that Angular's change detection is triggered correctly.

## License

MIT License. See LICENSE file for details.
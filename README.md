# Gistify Chrome Extension

Minimal Manifest V3 extension that:

- reads the user's highlighted text from the active tab
- sends it to a Commonstack-style chat endpoint
- shows a short vibe summary in the popup

## Files

- `manifest.json`: extension config and permissions
- `popup.html`: popup markup
- `popup.css`: popup styles
- `popup.js`: selection capture and API request logic

## Before testing

1. Open `popup.js`.
2. Set `COMMONSTACK_API_KEY`.
3. Confirm `COMMONSTACK_API_URL` and `model` match the actual Commonstack API you plan to use.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this `vibecheck-extension` folder.

## Test flow

1. Open any webpage.
2. Highlight a block of text.
3. Click the extension icon.
4. The popup should show the generated vibe analysis.

## Notes

- If Commonstack uses a private server-side key, do not ship it in the extension. Put a small backend proxy in front of the API instead.
- Some sites with complex editors may not expose selection text consistently.

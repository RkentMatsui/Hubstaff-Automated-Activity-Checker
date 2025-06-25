# Hubstaff Screenshot Checker Chrome Extension

This Chrome extension helps you analyze activity screenshots for suspicious patterns and optionally uses the Gemini API for visual similarity checks.

## Features

- Flag screenshots with low total activity.
- Flag screenshots with low keyboard and high mouse activity.
- Optionally compare consecutive screenshots using Gemini API for visual similarity.
- Configurable thresholds via popup UI.

## Setup

1. Clone or download this repository.
2. Replace `YOUR_GEMINI_API_KEY` in `content.js` with your actual Gemini API key if you want to use the Gemini comparison.
3. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this folder.

## Usage

- Click the extension icon to open the popup.
- Adjust thresholds and toggle Gemini API usage as needed.
- Click "Run Screenshot Check" to analyze screenshots on the current page.

## Files

- `popup.html` - Extension popup UI.
- `popup.js` - Handles popup logic and settings.
- `content.js` - Runs in the context of the page to analyze screenshots.
- `background.js` - Handles extension icon click.
- `README.md` - This file.

## Notes

- The extension expects screenshots to be in elements with classes `.screenshot-container` or `.activity-screenshot`.
- Activity data should be in a `.progress` element's `data-original-title` attribute.
- Gemini API usage is optional and requires a valid API key.
- Gemini API is also quite slow considering it needs to receive the image then process that.

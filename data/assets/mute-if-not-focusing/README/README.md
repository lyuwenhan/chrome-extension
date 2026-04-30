# Focus Mute

A lightweight Chrome extension that automatically mutes all tabs unless the page is currently focused, and pauses playable media when the page loses focus.

## Features

- Automatically mutes all tabs except the currently focused page
- Mutes all tabs when Chrome is not in the foreground
- Pauses HTML5 audio/video when a page loses focus
- Resumes only media that was paused by the extension
- Works with common players such as YouTube

## Behavior

- Active tab in focused window → unmuted
- Background tabs → muted
- Chrome unfocused (user switches to another app) → all tabs muted
- Page loses focus → audio/video paused
- Page regains focus → previously paused media resumes

## Limitations

- Only standard HTML5 `<audio>` and `<video>` elements are paused
- Media using WebAudio (e.g. some games) may not be pausable and will only be muted
- Does not apply to restricted pages such as `chrome://` or extension store pages

## Privacy

This extension does not collect, store, or transmit any personal data.
All logic runs locally within the browser. No external servers or network requests are involved.

## Permissions

- `tabs`: required to control tab mute state
- `<all_urls>`: required to detect page focus and control media playback via content scripts

## License

MIT

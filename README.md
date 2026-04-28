# Markr

Multi-color highlights for [Obsidian](https://obsidian.md), stored as plain Markdown.

Markr writes highlights using the standard `==text==` syntax with an optional color emoji at the start of the span. Files stay valid Markdown — they render correctly anywhere, with or without the plugin.

```markdown
==🟢 a green note==
==🔴 something important==
==🔵 an idea==
==a default-colored highlight==
```

## Features

- **Inline color picker.** Move the cursor inside any highlight and a small color emoji appears. Click it to change the color. Click away and the marker disappears so the text reads cleanly.
- **Native toggle integration.** Markr uses Obsidian's standard `==text==` highlight syntax — the built-in *Toggle highlight* command creates and removes highlights as expected. Bind it to a shortcut in *Settings → Hotkeys*.
- **Mobile-friendly.** Long-press → *Highlight* menu uses the same picker.
- **Markdown-native.** Color is encoded as a single emoji inside the `==…==`, so files round-trip through any other Markdown editor or renderer.

## Install

### From the community plugin store

*Coming soon — pending submission.*

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [release](https://github.com/rodrigo-arias/obsidian-markr/releases).
2. Place them in `<vault>/.obsidian/plugins/markr/`.
3. Enable **Markr** in *Settings → Community plugins*.

## Commands

| Command | What it does |
| --- | --- |
| **Markr: Open color picker** | Opens the color menu at the cursor. |
| **Markr: Remove highlight** | Strips the wrapping under the cursor or selection. |

To create a highlight, use Obsidian's built-in *Toggle highlight* command (assign a shortcut in *Settings → Hotkeys*). To unwrap a colored highlight cleanly, use *Markr: Remove highlight* — Obsidian's toggle removes only the `==` markers and would leave the color emoji behind.

## How it works

A colored highlight is just `==🟢 text==` — the emoji is part of the file content. The plugin parses the leading emoji to determine the color and renders the inline picker on top. The colors are fixed: 🟢 🔴 🔵 🟡 🟣 🟠. A default highlight is stored as plain `==text==` (no emoji) and shows in the standard highlight color; the picker labels it with ⚪ for visual consistency, but that emoji is never written to disk.

## Development

```bash
git clone https://github.com/rodrigo-arias/obsidian-markr.git
cd obsidian-markr
pnpm install
pnpm dev    # tsdown watch
```

Symlink or place the build output in `<vault>/.obsidian/plugins/markr/` and reload Obsidian (`Cmd/Ctrl-R`) after each rebuild.

```bash
pnpm test   # vitest
pnpm check  # biome lint + format
pnpm build  # production bundle
```

## License

[MIT](LICENSE)

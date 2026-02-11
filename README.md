# WC3 Sounds — Pi Extension

Warcraft III voice lines for [pi](https://github.com/badlogic/pi-mono) lifecycle events.

Sounds sourced from [peon-ping](https://github.com/tonyyont/peon-ping) by [@tonyyont](https://github.com/tonyyont).

## Install

```bash
pi install https://github.com/h4nky/pi-wc3-sounds
```

## Sound Packs by Model

| Model | Pack | Character |
|---|---|---|
| Claude (Anthropic) | 🪓 Orc Peon | *"Work, work."*, *"Me not that kind of orc!"* |
| Codex | 🏰 Human Peasant | *"Yes, milord?"*, *"Right-o."* |
| Any other model | 🪓 Orc Peon (default) | |

Pack switches automatically when you change models.

## Events

| Event | Category | Peon Examples | Peasant Examples |
|---|---|---|---|
| Session starts | 🎙️ Greeting | *"Ready to work?"*, *"What you want?"* | *"Ready to work."*, *"Yes, milord?"* |
| Agent starts | ⚔️ Acknowledge | *"Work, work."*, *"Okie dokie."* | *"Right-o."*, *"Off I go, then!"* |
| Agent finishes | ✅ Complete | *"Something need doing?"* | *"More work?"* |
| Tool error | 💀 Error | *"Me not that kind of orc!"* | *"That's it. I'm dead."* |
| Rapid prompts | 😤 Annoyed | *"Me busy, leave me alone!"* | *"Help! I'm being repressed!"* |

## Commands

| Command | Description |
|---|---|
| `/wc3-mute` | Toggle sounds on/off |
| `/wc3-volume [0.0–1.0]` | Set volume (e.g. `/wc3-volume 0.3`) |
| `Ctrl+Shift+M` | Quick mute toggle |

## Requirements

macOS only (uses `afplay`). Silently no-ops on other platforms.

## License

MIT

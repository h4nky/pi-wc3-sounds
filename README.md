# WC3 Sounds — Pi Extension

Warcraft III Orc Peon voice lines for [pi](https://github.com/badlogic/pi-mono) lifecycle events.

Sounds sourced from [peon-ping](https://github.com/tonyyont/peon-ping) by [@tonyyont](https://github.com/tonyyont).

## What you'll hear

| Event | Sound | Examples |
|---|---|---|
| Session starts | 🎙️ Greeting | *"Ready to work?"*, *"Yes?"*, *"What you want?"* |
| Agent starts working | ⚔️ Acknowledge | *"Work, work."*, *"I can do that."*, *"Okie dokie."* |
| Agent finishes | ✅ Complete | *"Something need doing?"*, *"Ready to work?"* |
| Tool error | 💀 Error | *"Me not that kind of orc!"* |
| Rapid prompts (3+ in 10s) | 😤 Annoyed | *"Me busy, leave me alone!"* |

## Commands

| Command | Description |
|---|---|
| `/wc3-mute` | Toggle sounds on/off |
| `/wc3-volume [0.0–1.0]` | Set volume (e.g. `/wc3-volume 0.3`) |
| `Ctrl+Shift+M` | Quick mute toggle |

## Install

Copy the `wc3-sounds` folder to `~/.pi/agent/extensions/` and run `/reload` in pi.

## Requirements

macOS only (uses `afplay`). Silently no-ops on other platforms.

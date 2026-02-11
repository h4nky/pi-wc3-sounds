/**
 * WC3 Sounds — Pi Extension
 *
 * Plays Warcraft III voice lines on pi lifecycle events.
 * Sound packs sourced from https://github.com/tonyyont/peon-ping
 *
 * Pack selection by model:
 *   Claude models → Orc Peon ("Work, work.", "Me not that kind of orc!")
 *   Codex models  → Human Peasant ("Yes, milord?", "Right-o.")
 *   Other models  → Orc Peon (default)
 *
 * Events:
 *   session_start  → greeting
 *   agent_start    → acknowledge (or annoyed on rapid prompts)
 *   agent_end      → complete
 *   tool error     → error
 *
 * Commands:
 *   /wc3-mute      — Toggle mute
 *   /wc3-volume    — Set volume (0.0–1.0)
 *
 * macOS only (uses afplay). Falls back to no-op on other platforms.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";
import { execFile } from "node:child_process";

// ── Types ──────────────────────────────────────────────────────────────────

interface SoundEntry {
  file: string;
  line: string;
}

interface PackManifest {
  name: string;
  display_name: string;
  categories: Record<string, { sounds: SoundEntry[] }>;
}

type Category = "greeting" | "acknowledge" | "complete" | "error" | "permission" | "annoyed";

// ── State ──────────────────────────────────────────────────────────────────

const PACKS_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "packs");
const IS_MACOS = process.platform === "darwin";

let muted = false;
let volume = 0.5;
let currentPack = "peon";
let lastPlayed: Record<string, string> = {};
let promptTimestamps: number[] = [];

const ANNOYED_THRESHOLD = 3;
const ANNOYED_WINDOW_MS = 10_000;

// ── Pack selection by model ────────────────────────────────────────────────

function packForModel(model: { provider?: string; id?: string; name?: string } | undefined): string {
  if (!model) return "peon";

  const id = (model.id ?? "").toLowerCase();
  const provider = (model.provider ?? "").toLowerCase();

  // Codex models → Human Peasant
  if (id.includes("codex") || provider.includes("codex")) return "peasant";

  // Claude models → Orc Peon
  if (id.includes("claude") || provider.includes("anthropic")) return "peon";

  // Default → Orc Peon
  return "peon";
}

function syncPackToModel(ctx: { model?: any }): void {
  const newPack = packForModel(ctx.model);
  if (newPack !== currentPack) {
    currentPack = newPack;
    lastPlayed = {};
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function loadManifest(packName: string): PackManifest | null {
  const manifestPath = path.join(PACKS_DIR, packName, "manifest.json");
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  } catch {
    return null;
  }
}

function pickSound(category: Category): { file: string; line: string } | null {
  const manifest = loadManifest(currentPack);
  if (!manifest) return null;

  const sounds = manifest.categories[category]?.sounds;
  if (!sounds || sounds.length === 0) return null;

  // Avoid immediate repeats
  const lastFile = lastPlayed[category];
  const candidates =
    sounds.length > 1 ? sounds.filter((s) => s.file !== lastFile) : sounds;

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  lastPlayed[category] = pick.file;
  return pick;
}

function playSound(category: Category): string | null {
  if (muted || !IS_MACOS) return null;

  const sound = pickSound(category);
  if (!sound) return null;

  const soundPath = path.join(PACKS_DIR, currentPack, "sounds", sound.file);
  if (!fs.existsSync(soundPath)) return null;

  execFile("afplay", ["-v", String(volume), soundPath], (err) => {
    if (err && (err as any).code !== "ERR_CHILD_PROCESS_STDIO_FINAL_ERROR") {
      // Silently ignore playback errors
    }
  });

  return sound.line;
}

function checkAnnoyed(): boolean {
  const now = Date.now();
  promptTimestamps = promptTimestamps.filter((t) => now - t < ANNOYED_WINDOW_MS);
  promptTimestamps.push(now);
  return promptTimestamps.length >= ANNOYED_THRESHOLD;
}

function packEmoji(): string {
  return currentPack === "peasant" ? "🏰" : "🪓";
}

// ── Extension ──────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // ── Model change → switch pack ─────────────────────────────────────────
  pi.on("model_select", async (event, ctx) => {
    const newPack = packForModel(event.model);
    if (newPack !== currentPack) {
      currentPack = newPack;
      lastPlayed = {};
      const manifest = loadManifest(currentPack);
      const name = manifest?.display_name ?? currentPack;
      ctx.ui.setStatus("wc3", `${packEmoji()} Switched to ${name}`);
      setTimeout(() => ctx.ui.setStatus("wc3", undefined), 3000);
    }
  });

  // ── Session start → greeting ───────────────────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    syncPackToModel(ctx);
    const line = playSound("greeting");
    if (line) {
      ctx.ui.setStatus("wc3", `${packEmoji()} "${line}"`);
      setTimeout(() => ctx.ui.setStatus("wc3", undefined), 3000);
    }
  });

  // ── Agent start → acknowledge ──────────────────────────────────────────
  pi.on("agent_start", async (_event, ctx) => {
    syncPackToModel(ctx);

    // Check annoyed state (rapid prompts)
    if (checkAnnoyed()) {
      const line = playSound("annoyed");
      if (line) {
        ctx.ui.setStatus("wc3", `😤 "${line}"`);
        setTimeout(() => ctx.ui.setStatus("wc3", undefined), 3000);
      }
      return;
    }

    const line = playSound("acknowledge");
    if (line) {
      ctx.ui.setStatus("wc3", `⚔️ "${line}"`);
      setTimeout(() => ctx.ui.setStatus("wc3", undefined), 3000);
    }
  });

  // ── Agent end → complete ───────────────────────────────────────────────
  pi.on("agent_end", async (_event, ctx) => {
    const line = playSound("complete");
    if (line) {
      ctx.ui.setStatus("wc3", `✅ "${line}"`);
      setTimeout(() => ctx.ui.setStatus("wc3", undefined), 4000);
    }
  });

  // ── Tool error → error sound ───────────────────────────────────────────
  pi.on("tool_result", async (event, ctx) => {
    if (event.isError) {
      const line = playSound("error");
      if (line) {
        ctx.ui.setStatus("wc3", `💀 "${line}"`);
        setTimeout(() => ctx.ui.setStatus("wc3", undefined), 3000);
      }
    }
  });

  // ── /wc3-mute — toggle mute ────────────────────────────────────────────
  pi.registerCommand("wc3-mute", {
    description: "Toggle WC3 sound effects on/off",
    handler: async (_args, ctx) => {
      muted = !muted;
      ctx.ui.notify(muted ? "🔇 WC3 sounds muted" : "🔊 WC3 sounds unmuted", "info");
    },
  });

  // ── /wc3-volume — set volume ───────────────────────────────────────────
  pi.registerCommand("wc3-volume", {
    description: "Set WC3 sound volume (0.0–1.0)",
    handler: async (args, ctx) => {
      if (args) {
        const v = parseFloat(args);
        if (!isNaN(v) && v >= 0 && v <= 1) {
          volume = v;
          ctx.ui.notify(`🔊 Volume set to ${(volume * 100).toFixed(0)}%`, "info");
          playSound("greeting");
          return;
        }
      }

      const input = await ctx.ui.input("Volume (0.0–1.0):", String(volume));
      if (input === undefined) return;

      const v = parseFloat(input);
      if (isNaN(v) || v < 0 || v > 1) {
        ctx.ui.notify("Invalid volume. Use a number between 0.0 and 1.0", "error");
        return;
      }

      volume = v;
      ctx.ui.notify(`🔊 Volume set to ${(volume * 100).toFixed(0)}%`, "info");
      playSound("greeting");
    },
  });

  // ── Keyboard shortcut: Ctrl+Shift+M to toggle mute ────────────────────
  pi.registerShortcut("ctrl+shift+m", {
    description: "Toggle WC3 sounds mute",
    handler: async (ctx) => {
      muted = !muted;
      ctx.ui.notify(muted ? "🔇 WC3 sounds muted" : "🔊 WC3 sounds unmuted", "info");
    },
  });
}

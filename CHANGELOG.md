# Changelog

## v0.1.1 - 2026-10-06

- `/chatfish help` lists every command, setting, mode and rate.
- Offline chat draws from 200,000 to 1.2 million template combinations depending on mode (was a few
  thousand lines), keeps the mode's mood, and rarely repeats when Haiku is skipped or unavailable.
- Desktop: the "Send a message" box clears after you send, spans the pane, and the stray short divider
  under the header is gone.
- Saved settings: only the keys you change are written, a failed read never wipes what is stored, and a
  hot reload no longer re-applies old values.
- Replies always get an answer once anyone is watching; interrupted or failed turns no longer read as wins.

## v0.1.0 - 2026-10-06

First release.

- `/chatfish live|off|reply|config|status` and a "Send a message" box in the pane.
- Twitch-style pane: dark theme, colored names, badges (SVG icons on Desktop, emoji in the terminal),
  sub and raid notices, mentions of you highlighted, emotes drawn as emoji.
- Chat lines from Claude Haiku, fed with your prompts, Claude's tool calls, errors, what Claude says
  and how long it's been quiet. Canned lines when a call fails.
- Eight regulars with fixed personalities who talk to each other and answer you in character.
- Audience that ramps up from zero, drifts, leaves when nothing happens, and gets raided.
- Streamer name from your Claude display name, falling back to your email's local part.
- Settings (name, mode, viewers, rate) persist across sessions.
- Warns when loaded on Claude Code older than 2.1.281.

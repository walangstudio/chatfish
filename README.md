# chatfish

A fake Twitch chat that sits next to your Claude Code session and watches you work.

Claude thinks for three minutes, chat starts asking if it froze. A test fails, someone spams KEKW. You
type `/chatfish reply should I just rewrite this in rust`, and rustacean_rae has opinions. Nobody is
actually watching, but it beats staring at a spinner.

## Requirements

- **Claude Code 2.1.281 or later.** Found by bisecting the published builds: 2.1.281 loads chatfish and
  passes its tests, 2.1.280 doesn't. Older builds print a
  `chatfish: hooks module did not load` line, and chatfish shows a warning toast if it ever loads on an
  older build anyway.
- **Mods switched on.** chatfish is a mod (a plugin built on Claude Code's function hooks), which is
  still early access. Add this to the `env` block of `~/.claude/settings.json`:

  ```json
  "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1"
  ```

- Works in the terminal and in Claude Desktop's Code tab. Desktop looks better: badges are real icons
  and the colors are exact. The terminal falls back to emoji badges.

## Install

```
/plugin marketplace add walangstudio/marketplace
/plugin install chatfish@walangstudio
```

Restart Claude Code (or quit and reopen Claude Desktop), then:

```
/chatfish live
```

## Commands

| Command | What it does |
| --- | --- |
| `/chatfish live` | Go live. Also `on` or `start`. Chat starts empty and fills up as viewers arrive. |
| `/chatfish live roast 5k frequent` | Go live with a mode, viewer target and chat rate, in any order. |
| `/chatfish off` | End the stream. Also `stop` or `offline`. Closing the pane does the same. |
| `/chatfish reply <message>` | Say something in chat. Works while Claude is busy. `@name` someone to get them to answer. |
| `/chatfish config <key=value ...>` | Change settings, live or not. See below. |
| `/chatfish` | Show the current settings. Also `status`. |
| `/chatfish help` | List every command, setting, mode and rate. |

You can also type straight into the "Send a message" box at the bottom of the pane.

### Settings

Settings stick across sessions.

```
/chatfish config name=CodeCat viewers=5k
/chatfish config nickname: CodeCat, audience: 300, mode: roast, rate: spam
/chatfish config name=auto
```

| Key | Aliases | Values |
| --- | --- | --- |
| `name` | `nick`, `nickname`, `streamer` | What chat calls you, 1-25 characters, no spaces. `auto` uses your Claude display name, then the part of your email before the `@`, then `streamer`. |
| `viewers` | `audience` | Target audience, 1 to 1,000,000. `5k` works. |
| `mode` | | `hype`, `roast`, `mixed` (default), `curious`, `wholesome`, `chaos` |
| `rate` | `chat` | `quiet`, `normal` (default), `frequent`. `less`, `moderate`, `spam` work too. |

## What chat sees

- Your prompts, every tool Claude runs (with the command or file), errors, and what Claude says at the
  end of a turn.
- How long nothing has happened, and whether Claude is still thinking or just done.
- Your replies, plus the last 15 to 30 lines of chat, so conversations keep going.

Eight regulars show up every stream with their own personalities: async_annie explains things,
tabsnotspaces nitpicks your naming, kekw_kevin laughs at every error, and so on. Everyone else is a
random handle. Expect about a third of chat to be about your code, a third to be people talking to each
other, and a third to be complete nonsense.

The audience isn't a fixed number. Viewers trickle in over the first two minutes, drift on their own,
leave when nothing happens for a while, come back when things get going, and now and then another
channel raids you.

## Cost

Chat lines come from Claude Haiku through your normal Claude Code login. chatfish calls it when
something new happens on stream, plus every third quiet tick. Ticks are 3, 6 or 12 seconds apart
depending on `rate`, so `frequent` with a busy session is the expensive end. When a call fails, chat
falls back to canned lines.

## Development

```
claude plugin validate .
claude plugin test .
claude --plugin-dir .
```

`hooks/register.tsx` is the mod itself, `hooks/chat.ts` holds the parsing and prompt logic, and
`hooks/chatfish.test.tsx` covers both.

## License

MIT

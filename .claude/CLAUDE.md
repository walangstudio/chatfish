# CLAUDE.md

chatfish: a Claude Code mod (function-hooks plugin) that draws a fake Twitch chat pane and feeds it with Haiku.

- `hooks/register.tsx` - the hooks module: commands, the stream ticker, activity capture, the Pane drawing
- `hooks/chat.ts` - pure logic: argument/config parsing, prompts, crowd model, model-output parsing
- `hooks/canned.ts` - offline chat lines and handles used when Haiku is skipped or fails
- `hooks/chatfish.test.tsx` - every test, run by the engine itself
- `types/index.d.ts` - the `$.state` contract, named in `.claude-plugin/plugin.json` as `types`

## The loop

```bash
claude plugin validate .
claude plugin test .
npx -y -p typescript@5 tsc -p <tsconfig that includes the claude-code types, hooks/ and types/>
```

`.claude-plugin/types/` (the engine-written API types and tsconfig) only appears once the mod has loaded from a
folder you own; it is gitignored. The API declaration for your build is the authority: grep it, do not guess.

Minimum supported Claude Code is `MIN_CLAUDE_CODE` in `hooks/chat.ts` (2.1.281). Before raising or relying on a
newer API, run validate and test with that build's `claude.exe` from
`https://downloads.claude.ai/claude-code-releases/<version>/win32-x64/claude.exe.zst`, and update the README,
`plugin.json` description, CHANGELOG and the walangstudio marketplace entry together.

## Architecture

Commands and hooks write activity into `$.state`; a `$.clock.every` ticker turns activity into chat lines (Haiku via
`$.model.complete`, canned fallback) and drips them into the `lines` atom; the `Pane` render hook reads the atoms.

- Everything per live stream lives in one `Stream` object. Going live or offline replaces it; async work compares
  its captured stream to the current one and drops itself when stale. Do not add loose module flags for stream state.
- Hooks on the session's hot path (`tool.call`, `prompt.submit`, `turn.complete`) record with `note()`, never awaited.
- Settings persist in `$.store` under `settings` and are re-validated by `fromSaved` on load.

## Failure log

- Spell the engine parameter `$` and pass it only to functions declared at the top of the same file; the validator
  refuses anything else.
- Test stubs answer with `{ value: ... }`; a bare object is refused as "neither { value } nor { deny }".
- Command tests need `mock.store(on)`; nothing beneath the plugin answers `store.*` otherwise.
- If `claude plugin test` says the rollout switch is saved off, run `claude -p "ok"` once to refresh it.
- Never put a literal zero-width character in a source file; the shellter hook blocks the write.
- Look up word maps with `Object.hasOwn`; "constructor" is a real chat word and a prototype key.

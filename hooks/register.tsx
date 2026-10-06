import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Activity, Badge, ChatLine, Config } from '../types'
import {
  DEFAULT_CONFIG, HELP, MIN_CLAUDE_CODE, NEW_CROWD, fromSaved, PERIOD_MS, USAGE, isOlderThan, liveViewers, maybeRaid, nextViewers, stepCrowd, badgesFor, batchSize, emotify, toHandle, formatViewers,
  nameColor, parseArgs, parseModelLines, systemPrompt, userPrompt,
} from './chat'
import type { Crowd, Parsed } from './chat'
import { cannedChat } from './canned'

type Engine = EngineInterface

const PANE = 'chatfish'
const config = atom({ plugin: 'chatfish', key: 'config' } as const, DEFAULT_CONFIG)
const lines = atom({ plugin: 'chatfish', key: 'lines' } as const, [])
const activity = atom({ plugin: 'chatfish', key: 'activity' } as const, [])
const viewerCount = atom({ plugin: 'chatfish', key: 'viewers' } as const, 0)
// Bumped per message sent from the pane. It keys the input, so each send draws a fresh, empty field;
// the text stays with the host while typing, so keystrokes never re-render the pane.
const sentCount = atom({ plugin: 'chatfish', key: 'sent' } as const, 0)
// In $.state, not the module, so a hot reload does not load saved settings over newer ones.
const isSettingsLoaded = atom({ plugin: 'chatfish', key: 'isSettingsLoaded' } as const, false)

// Twitch dark theme: surface #18181B, text #EFEFF1, muted #ADADB8, borders #2F2F35, brand purple #9146FF.
const TW = {
  bg: '#18181B', text: '#EFEFF1', muted: '#ADADB8', border: '#2F2F35', input: '#464649',
  purple: '#9146FF', streamer: '#E91916', notice: '#1F1F23', mention: '#4A1A1D', live: '#EB0400',
}

// Twitch badges are 18px colored tiles with a white icon. Desktop draws them as SVG;
// the terminal has no images, so it shows the emoji closest to each icon.
const BADGE: Record<Badge, { emoji: string; bg: string; icon: string }> = {
  broadcaster: { emoji: '🎥', bg: '#E91916', icon: '<rect x="3" y="6" width="8" height="6" rx="1"/><path d="M11 8.5L15 6.5V11.5L11 9.5Z"/>' },
  mod: { emoji: '🔨', bg: '#00AD03', icon: '<path d="M13.5 3H15V4.5L8 11.5L6.5 10Z"/><path d="M5 9.5L8.5 13L7.5 14L4 10.5Z"/><path d="M5 12L6 13L4 15L3 14Z"/>' },
  vip: { emoji: '💎', bg: '#E005B9', icon: '<path d="M4 7L7 4H11L14 7L9 14Z"/>' },
  sub: { emoji: '⭐', bg: '#9146FF', icon: '<path d="M9 2.5L10.9 6.9L15.5 7.2L12 10.2L13.1 14.8L9 12.3L4.9 14.8L6 10.2L2.5 7.2L7.1 6.9Z"/>' },
  prime: { emoji: '👑', bg: '#0E9BD8', icon: '<path d="M3 13V6L6 9L9 4L12 9L15 6V13Z"/>' },
}

const badgeSvg = (b: Badge) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><rect width="18" height="18" rx="3" fill="${BADGE[b].bg}"/><g fill="#fff">${BADGE[b].icon}</g></svg>`

// One live stream. Going live or offline replaces it, so anything still running for the old
// one sees it is stale and drops its work instead of leaking into the next stream.
// ponytail: lives in the module, so a mod reload starts a fresh crowd; move to $.state if that shows.
type Stream = { isBusy: boolean; isQueued: boolean; seenSeq: number; crowdSeq: number; idleTicks: number; crowd: Crowd }
const newStream = (seq = 0): Stream => ({ isBusy: false, isQueued: false, seenSeq: seq, crowdSeq: seq, idleTicks: 0, crowd: NEW_CROWD })

let stream = newStream()
let ticker: Timer | undefined
let isTurnRunning = false
let autoName = ''

// Claude Code keeps the claude.ai profile (display name, email) in ~/.claude.json.
async function lookupName($: Engine) {
  const home = (await $.env.get('CLAUDE_CONFIG_DIR')) ?? (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME'))
  if (!home) return ''
  try {
    const account = JSON.parse(await $.fs.read(`${home}/.claude.json`)).oauthAccount ?? {}
    const name = String(account.displayName ?? '').trim() || String(account.emailAddress ?? '').split('@')[0] || ''
    return toHandle(name)
  } catch {
    return ''
  }
}

const NOT_SAVED = ' Could not save it for next time.'
const clip = (s: string) => (s.length > 100 ? `…${s.slice(-99)}` : s)
const streamerName = (cfg: Config) => cfg.streamer || autoName || 'streamer'
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function addLines($: Engine, parsed: (Parsed | { kind: ChatLine['kind']; user: string; text: string })[]) {
  return update($, lines, list => {
    let id = list.at(-1)?.id ?? 0
    return [...list, ...parsed.map(p => ({ ...p, id: ++id }))].slice(-200)
  })
}

async function record($: Engine, kind: Activity['kind'], text: string) {
  if (!(await read($, config)).live) return
  const at = await $.clock.now()
  await update($, activity, list => [...list, { seq: (list.at(-1)?.seq ?? 0) + 1, at, kind, text }].slice(-15))
}

// For hooks on the session's hot path: chat bookkeeping must never hold up a tool or a turn.
// Entries passed together are recorded in that order.
function note($: Engine, ...entries: [Activity['kind'], string][]) {
  void (async () => {
    for (const [kind, text] of entries) await record($, kind, text)
  })().catch(() => {})
}

async function say($: Engine, cfg: Config, text: string) {
  await addLines($, [{ kind: 'streamer', user: streamerName(cfg), text }])
  await record($, 'reply', text)
  void tick($, true)
}

// Writes only the settings a command changed, merged into what is stored, so a value
// this session never touched is never overwritten. False when the store refuses; the
// setting still applies to this session.
async function saveSettings($: Engine, patch: Partial<Config>) {
  const changed = fromSaved(patch)
  if (Object.keys(changed).length === 0) return true
  try {
    await $.store.set('settings', { ...fromSaved(await $.store.get('settings')), ...changed })
    return true
  } catch {
    return false
  }
}

const saveNote = (isSaved: boolean) => (isSaved ? '' : NOT_SAVED)

// Settings from earlier sessions, merged in once per session; concurrent callers share one load.
// A failure is reported once and not retried, so it can never overwrite changes made since.
let savedLoad: Promise<void> | undefined
function loadSaved($: Engine) {
  savedLoad ??= (async () => {
    if (await read($, isSettingsLoaded)) return
    try {
      const saved = fromSaved(await $.store.get('settings'))
      if (Object.keys(saved).length) await update($, config, c => ({ ...c, ...saved }))
    } catch {
      try {
        $.ui.toast('chatfish could not load its saved settings; using the current ones.')
      } catch {}
    }
    await update($, isSettingsLoaded, () => true)
  })().catch(() => {})
  return savedLoad
}

async function tick($: Engine, isReply = false) {
  const s = stream
  // A reply that lands while Haiku is busy gets its own run afterwards; timer ticks just skip.
  if (s.isBusy) {
    if (isReply) s.isQueued = true
    return
  }
  s.isBusy = true
  const isStale = () => s !== stream
  try {
    const cfg = await read($, config)
    if (!cfg.live) return
    const now = await $.clock.now()
    const all = await read($, activity)
    const idleMs = now - Math.max(cfg.startedAt, all.at(-1)?.at ?? 0)
    if (isStale()) return
    s.crowd = stepCrowd(s.crowd, { idleMs, events: all.filter(a => a.seq > s.crowdSeq).map(a => a.kind) })
    s.crowdSeq = all.at(-1)?.seq ?? s.crowdSeq
    const before = await read($, viewerCount)
    if (isStale()) return
    const viewers = nextViewers(before, liveViewers(cfg.viewers, now - cfg.startedAt), s.crowd)
    const raid = maybeRaid(viewers, cfg.viewers)
    if (raid) {
      s.crowd = { ...s.crowd, raid: s.crowd.raid + raid.size }
      await addLines($, [{ kind: 'notice', user: raid.from, text: `is raiding with ${raid.size} viewers!` }])
      await record($, 'raid', `${raid.from} just raided the stream with ${raid.size} viewers`)
    }
    const trend = viewers < before * 0.98 ? 'falling' : viewers > before * 1.02 ? 'rising' : 'steady'
    if (isStale()) return
    await update($, viewerCount, () => viewers)
    if (isStale()) return
    $.ui.status(`● LIVE ${formatViewers(viewers)}`)
    // Someone always answers the streamer once anyone is watching.
    const count = Math.max(isReply && viewers > 0 ? 1 : 0, batchSize(cfg.rate, viewers))
    if (count === 0) return
    const fresh = all.filter(a => a.seq > s.seenSeq)
    s.seenSeq = all.at(-1)?.seq ?? s.seenSeq
    // ponytail: Haiku only on new activity or every 3rd idle tick; canned lines fill the rest to cap cost.
    const useModel = fresh.length > 0 || ++s.idleTicks % 3 === 0
    let next: Parsed[] = []
    if (useModel) {
      s.idleTicks = 0
      const replies = fresh.filter(a => a.kind === 'reply').map(a => a.text)
      const said = (await read($, lines)).filter(l => l.kind !== 'system')
      // A conversation needs more memory than plain hype does.
      const isTalking = replies.length > 0 || said.slice(-30).some(l => l.kind === 'streamer')
      const recent = said.slice(isTalking ? -30 : -15).map(l => `${l.user}: ${l.text}`)
      const r = await $.model.complete({
        model: 'haiku',
        effort: 'low',
        maxTokens: 600,
        timeoutMs: 20000,
        system: systemPrompt(cfg.mode, streamerName(cfg)),
        prompt: userPrompt({
          viewers,
          trend,
          uptimeMs: now - cfg.startedAt,
          idleMs,
          isThinking: isTurnRunning,
          count,
          activity: fresh.length ? fresh : all.slice(-5),
          isNew: fresh.length > 0,
          recent,
          replies,
        }),
      }).catch(() => undefined)
      if (r?.isAnswered) next = parseModelLines(r.text).slice(0, count + 1)
    }
    if (isStale()) return
    if (next.length === 0) next = cannedChat(cfg.mode, useModel ? count : Math.ceil(count / 2), fresh.at(-1))
    const at = `@${streamerName(cfg)}`
    next = next.map(l => ({ ...l, text: l.text.replace(/@streamer(?!\w)/g, () => at) }))
    const gap = PERIOD_MS[cfg.rate] / next.length
    next.forEach((line, i) => $.clock.after(Math.round(i * gap), () => {
      if (!isStale()) void addLines($, [line])
    }))
  } finally {
    s.isBusy = false
    if (s.isQueued && !isStale()) {
      s.isQueued = false
      // Only if the busy tick finished before the reply arrived; otherwise it already answered.
      const all = await read($, activity).catch(() => [])
      if (all.some(a => a.seq > s.seenSeq)) void tick($, true)
    }
  }
}

function start($: Engine, cfg: Config) {
  ticker?.cancel()
  ticker = $.clock.every(PERIOD_MS[cfg.rate], () => void tick($))
  void tick($)
}

function stop($: Engine) {
  ticker?.cancel()
  stream = newStream()
  ticker = undefined
  $.ui.status(undefined)
}

function describe(c: Config) {
  return `${streamerName(c)}, ${c.mode}, ${formatViewers(c.viewers)} viewers, ${c.rate}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'chatfish',
      description: 'Fake Twitch chat: on|off [mode] [viewers] [rate], reply <msg>',
      argumentHint: '<on|off|reply> [mode] [viewers] [rate]',
      immediate: true,
    })
    const { version } = await $.session.version()
    if (isOlderThan(version, MIN_CLAUDE_CODE)) {
      $.ui.toast(`chatfish needs Claude Code ${MIN_CLAUDE_CODE} or later (this is ${version}); some parts may not work.`)
    }
    autoName = await lookupName($)
    await loadSaved($)
    const cfg = await read($, config)
    if (cfg.live) {
      stream = newStream((await read($, activity)).at(-1)?.seq ?? 0)
      void $.ui.open({ id: PANE, title: 'Stream Chat' })
      start($, cfg)
    }
    return next(e)
  })

  on('command.run', { command: 'chatfish' }, async ($, e) => {
    const cmd = parseArgs(e.args)
    await loadSaved($)
    const cfg = await read($, config)
    switch (cmd.kind) {
      case 'error':
        return { text: cmd.text }
      case 'help':
        return { text: HELP }
      case 'status':
        return { text: `chatfish is ${cfg.live ? 'LIVE' : 'offline'} (${describe(cfg)})\n${USAGE}` }
      case 'off':
        await update($, config, c => ({ ...c, live: false }))
        stop($)
        await $.ui.close({ id: PANE })
        return { text: 'chatfish is offline.' }
      case 'config': {
        const nextCfg = await update($, config, c => ({ ...c, ...cmd.patch }))
        if (nextCfg.live && nextCfg.rate !== cfg.rate) start($, nextCfg)
        const isSaved = await saveSettings($, cmd.patch)
        return { text: `chatfish settings: ${describe(nextCfg)}${nextCfg.live ? ' (applied live)' : ''}${saveNote(isSaved)}` }
      }
      case 'on':
      case 'set': {
        const live = cmd.kind === 'on' || cfg.live
        const isGoingLive = live && !cfg.live
        const now = await $.clock.now()
        const nextCfg = await update($, config, c => ({ ...c, ...cmd.patch, live, startedAt: isGoingLive ? now : c.startedAt }))
        const isSaved = await saveSettings($, cmd.patch)
        if (!live) return { text: `chatfish settings ${isSaved ? 'saved' : 'set'} (${describe(nextCfg)}). /chatfish on to go live.${saveNote(isSaved)}` }
        if (isGoingLive) {
          stream = newStream()
          await update($, activity, () => [])
          await update($, viewerCount, () => 0)
          await update($, lines, () => [{ id: 1, kind: 'system', user: '', text: 'Welcome to the chat room!' }])
        }
        await $.ui.open({ id: PANE, title: 'Stream Chat' })
        start($, nextCfg)
        return { text: `chatfish is LIVE (${describe(nextCfg)}).${saveNote(isSaved)}` }
      }
      case 'reply':
        if (!cfg.live) return { text: 'chatfish is offline. /chatfish on first.' }
        await say($, cfg, cmd.text)
        return {}
    }
  })

  on('ui.close', { id: PANE }, async ($, e, next) => {
    if (e.origin.kind === 'person') {
      await update($, config, c => ({ ...c, live: false }))
      stop($)
    }
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    const result = await next(e)
    // Announce only prompts that went through, as the agent received them.
    // Chat sees what the streamer typed, not text other hooks wrapped around it.
    if (result.drop === undefined && !e.text.startsWith('/')) note($, ['prompt', `Streamer asked the agent: "${e.text.slice(0, 160)}"`])
    return result
  })

  on('tool.call', async ($, e, next) => {
    const input = e as unknown as Record<string, unknown>
    const target = [input.command, input.file_path, input.pattern, input.url, input.description, input.query]
      .find(v => typeof v === 'string') as string | undefined
    const tool = String(e.tool)
    note($, ['tool', `Agent runs ${tool}${target ? `: ${clip(target)}` : ''}`])
    const ran = await next(e)
    if ('deny' in ran && ran.deny) note($, ['error', `${tool} was blocked`])
    else if (ran.isError) note($, ['error', `${tool} failed${ran.text ? `: ${ran.text.slice(0, 100)}` : ''}`])
    return ran
  })

  on('turn.start', ($, e, next) => {
    isTurnRunning = true
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId) return next(e)
    isTurnRunning = false
    // isAborted predates reason on older builds.
    if (e.isAborted || e.reason === 'aborted') note($, ['error', 'The streamer interrupted Claude mid-task.'])
    else if (e.reason === 'error') note($, ['error', 'Claude hit an error and stopped.'])
    else if (e.reason === 'refusal') note($, ['error', 'Claude refused the task.'])
    else {
      const answer = e.answer.trim()
      const done: [Activity['kind'], string] = ['done', 'The agent finished its turn and is waiting for the streamer.']
      if (answer) note($, ['said', `Claude said: "${answer.slice(0, 200)}"`], done)
      else note($, done)
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Text } = els
    const cfg = await read($, config)
    const all = await read($, lines)
    const watching = await read($, viewerCount)
    const sent = await read($, sentCount)
    // Desktop draws its own field chrome and a proportional font, so cell-based rules look broken there.
    const isDesktop = e.surface === 'desktop'
    const mention = new RegExp(`@${escapeRe(streamerName(cfg))}(?![\\p{L}\\p{N}_])`, 'iu')
    const cols = Math.max(24, e.props.bodyColumns)
    const rows = Math.max(10, e.props.scroll.bodyRows || (e.viewport?.rows ?? 30))
    const inner = cols - 2
    const budget = rows - 7

    const shown: ChatLine[] = []
    let used = 0
    for (let i = all.length - 1; i >= 0 && used < budget; i--) {
      const l = all[i]!
      used += l.kind === 'notice' ? 2 : Math.ceil((l.user.length + l.text.length + 6) / inner)
      shown.unshift(l)
    }

    const row = (l: ChatLine) => {
      if (l.kind === 'system') return <Text key={`m${l.id}`} color={TW.muted}>{l.text}</Text>
      if (l.kind === 'notice') {
        return (
          <Box key={`m${l.id}`} backgroundColor={TW.notice} flexDirection="row">
            <Box width={1} backgroundColor={TW.purple} />
            <Box paddingX={1} flexGrow={1}>
              <Text bold color={TW.text} wrap="wrap">{l.user} {l.text}</Text>
            </Box>
          </Box>
        )
      }
      const badges: Badge[] = l.kind === 'streamer' ? ['broadcaster'] : badgesFor(l.user)
      const isMention = l.kind === 'chat' && mention.test(l.text)
      const name = <Text bold color={l.kind === 'streamer' ? TW.streamer : nameColor(l.user)}>{l.user}</Text>
      const body = <Text color={TW.text}>: {emotify(l.text)}</Text>
      if ('Svg' in els) {
        return (
          <Box key={`m${l.id}`} flexDirection="row" alignItems="flex-start" gap={1} backgroundColor={isMention ? TW.mention : undefined}>
            {badges.map(b => <els.Svg key={b} source={badgeSvg(b)} alt={b} width={18} height={18} />)}
            <Text wrap="wrap" color={TW.text}>{name}{body}</Text>
          </Box>
        )
      }
      return (
        <Box key={`m${l.id}`} backgroundColor={isMention ? TW.mention : undefined}>
          <Text wrap="wrap" color={TW.text}>
            {badges.map(b => BADGE[b].emoji).join('')}{badges.length > 0 && ' '}
            {name}
            {body}
          </Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column" width={cols} height={rows} backgroundColor={TW.bg}>
        <Box justifyContent="space-between" paddingX={1}>
          <Text color={TW.muted}>⇤</Text>
          <Text bold color={TW.text}>STREAM CHAT</Text>
          <Text>
            <Text color={cfg.live ? TW.live : TW.muted}>● </Text>
            <Text color={TW.muted}>{cfg.live ? formatViewers(watching) : '0'}</Text>
          </Text>
        </Box>
        {!isDesktop && <Text color={TW.border}>{'─'.repeat(cols)}</Text>}
        <Box flexDirection="column" flexGrow={1} justifyContent="flex-end" overflow="hidden" paddingX={1}>
          {cfg.live ? shown.map(row) : <Text color={TW.muted}>Stream is offline. /chatfish on</Text>}
        </Box>
        {cfg.live && 'Input' in els && (
          <Box
            flexDirection="column"
            {...(isDesktop ? { paddingX: 1, paddingY: 1 } : { marginX: 1, borderStyle: 'round' as const, borderColor: TW.input })}
          >
            <els.Input
              key={`send-${sent}`}
              placeholder="Send a message"
              submitLabel="Chat"
              onSubmit={async text => {
                // Swap in the empty field before anything slow, then hand the keyboard to it.
                const n = await update($, sentCount, c => c + 1)
                void $.ui.focus({ requestId: PANE, key: `send-${n}` }).catch(() => {})
                const message = text.trim()
                const now = await read($, config)
                if (message && now.live) await say($, now, message)
              }}
            />
          </Box>
        )}
      </Box>
    )
  })
}

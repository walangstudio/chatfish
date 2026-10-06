import type { Activity, Badge, Config, Mode, Rate } from '../types'

export const MODES: readonly Mode[] = ['hype', 'roast', 'mixed', 'curious', 'wholesome', 'chaos']
export const RATES: readonly Rate[] = ['quiet', 'normal', 'frequent']
export const DEFAULT_CONFIG: Config = { live: false, mode: 'mixed', viewers: 1200, rate: 'normal', startedAt: 0, streamer: '' }

const ON = ['on', 'start', 'live']
const OFF = ['off', 'stop', 'offline']
const RATE_ALIASES: Record<string, Rate> = {
  quiet: 'quiet', less: 'quiet', slow: 'quiet', low: 'quiet',
  normal: 'normal', moderate: 'normal', medium: 'normal',
  frequent: 'frequent', fast: 'frequent', high: 'frequent', spam: 'frequent',
}
const MODE_ALIASES: Record<string, Mode> = {
  hype: 'hype', praise: 'hype', praising: 'hype', positive: 'hype',
  roast: 'roast', roasting: 'roast',
  mixed: 'mixed', mix: 'mixed', both: 'mixed',
  curious: 'curious', questions: 'curious',
  wholesome: 'wholesome', kind: 'wholesome', supportive: 'wholesome',
  chaos: 'chaos', chaotic: 'chaos',
}

export type Command =
  | { kind: 'on'; patch: Partial<Config> }
  | { kind: 'off' }
  | { kind: 'set'; patch: Partial<Config> }
  | { kind: 'reply'; text: string }
  | { kind: 'status' }
  | { kind: 'config'; patch: Partial<Config> }
  | { kind: 'error'; text: string }

export const USAGE =
  'Usage: /chatfish <on|start|live|off|stop|offline> [mode] [viewers] [rate]  |  /chatfish reply <message>  |  /chatfish <mode|rate|viewers>\n' +
  `modes: ${MODES.join(', ')}  rates: ${RATES.join(', ')}  viewers: 1-1000000\n` +
  'Live settings: /chatfish config name=<nickname|auto> viewers=5k mode=roast rate=frequent  (key: value, comma separated, works too)'

function parseSettings(tokens: string[]): Partial<Config> | string {
  const patch: Partial<Config> = {}
  for (const raw of tokens) {
    const t = raw.toLowerCase().replace(/,/g, '')
    const k = /^(\d+(?:\.\d+)?)k$/.exec(t)
    const n = k ? Math.round(Number(k[1]) * 1000) : /^\d+$/.test(t) ? Number(t) : NaN
    if (!Number.isNaN(n)) {
      if (n < 1 || n > 1_000_000) return `viewers must be 1-1000000, got ${raw}`
      patch.viewers = n
    } else if (Object.hasOwn(MODE_ALIASES, t)) patch.mode = MODE_ALIASES[t]
    else if (Object.hasOwn(RATE_ALIASES, t)) patch.rate = RATE_ALIASES[t]
    else if (t !== 'mode' && t !== 'rate' && t !== 'viewers') return `unknown option "${raw}"`
  }
  return patch
}

const CONFIG_KEYS: Record<string, 'streamer' | 'viewers' | 'mode' | 'rate'> = {
  name: 'streamer', nick: 'streamer', nickname: 'streamer', streamer: 'streamer',
  viewers: 'viewers', audience: 'viewers', mode: 'mode', rate: 'rate', chat: 'rate',
}
const CONFIG_PAIR = new RegExp(`(\\w+)\\s*[:=]\\s*(.*?)(?=(?:\\s*,\\s*|\\s+)(?:${Object.keys(CONFIG_KEYS).join('|')})\\s*[:=]|\\s*,?\\s*$)`, 'gi')

export function parseConfig(text: string): Partial<Config> | string {
  const patch: Partial<Config> = {}
  let found = 0
  for (const [, rawKey = '', rawValue = ''] of text.matchAll(CONFIG_PAIR)) {
    found++
    const key = Object.hasOwn(CONFIG_KEYS, rawKey.toLowerCase()) ? CONFIG_KEYS[rawKey.toLowerCase()] : undefined
    if (!key) return `unknown setting "${rawKey}"`
    const value = rawValue.replace(/^["']|["']$/g, '').trim()
    if (key === 'streamer') {
      const name = value.replace(/^@/, '')
      if (name.toLowerCase() === 'auto') patch.streamer = ''
      else if (name && toHandle(name) === name) patch.streamer = name
      else return `name must be 1-25 characters with no spaces, commas, = or :, got "${value}"`
      continue
    }
    const one = parseSettings([value])
    if (typeof one === 'string') return one
    if (one[key] === undefined) return `bad value for ${rawKey}: "${value}"`
    Object.assign(patch, { [key]: one[key] })
  }
  const leftover = text.replace(CONFIG_PAIR, '').replace(/[\s,]/g, '')
  if (leftover) return `could not read "${leftover}"`
  return found ? patch : 'nothing to set'
}

// Settings kept across sessions. The store is a file anyone can edit, so every field is re-checked.
export type Saved = Pick<Config, 'mode' | 'viewers' | 'rate' | 'streamer'>

export function fromSaved(v: unknown): Partial<Saved> {
  if (typeof v !== 'object' || v === null) return {}
  const o = v as Record<string, unknown>
  const out: Partial<Saved> = {}
  if (typeof o.mode === 'string' && (MODES as readonly string[]).includes(o.mode)) out.mode = o.mode as Mode
  if (typeof o.rate === 'string' && (RATES as readonly string[]).includes(o.rate)) out.rate = o.rate as Rate
  if (typeof o.viewers === 'number' && Number.isInteger(o.viewers) && o.viewers >= 1 && o.viewers <= 1_000_000) out.viewers = o.viewers
  if (typeof o.streamer === 'string' && (o.streamer === '' || toHandle(o.streamer) === o.streamer)) out.streamer = o.streamer
  return out
}

export function parseArgs(args: string): Command {
  const trimmed = args.trim()
  if (trimmed === '' || trimmed.toLowerCase() === 'status') return { kind: 'status' }
  const [head = '', ...rest] = trimmed.split(/\s+/)
  const verb = head.toLowerCase()
  if (verb === 'reply' || verb === 'say') {
    const text = trimmed.slice(head.length).trim()
    return text ? { kind: 'reply', text } : { kind: 'error', text: 'Nothing to say. /chatfish reply <message>' }
  }
  if (OFF.includes(verb)) return { kind: 'off' }
  if (verb === 'config' || verb === 'set') {
    const patch = parseConfig(trimmed.slice(head.length))
    return typeof patch === 'string' ? { kind: 'error', text: `${patch}\n${USAGE}` } : { kind: 'config', patch }
  }
  const isOn = ON.includes(verb)
  const patch = parseSettings(isOn ? rest : [head, ...rest])
  if (typeof patch === 'string') return { kind: 'error', text: `${patch}\n${USAGE}` }
  return isOn ? { kind: 'on', patch } : { kind: 'set', patch }
}

export const PERIOD_MS: Record<Rate, number> = { quiet: 12000, normal: 6000, frequent: 3000 }

// ponytail: fixed 2-minute ramp; make it a setting if people want slow-burn streams.
export const RAMP_MS = 120_000

export const liveViewers = (target: number, elapsedMs: number) =>
  Math.round(target * Math.min(1, Math.max(0, elapsedMs) / RAMP_MS) ** 2)

export function batchSize(rate: Rate, viewers: number, rand = Math.random) {
  if (viewers < 1) return 0
  const base = { quiet: 2, normal: 4, frequent: 6 }[rate]
  const scale = viewers < 200 ? viewers / 200 : 1 + Math.log10(viewers / 200) / 2
  const expected = Math.min(10, base * scale)
  return Math.floor(expected) + (rand() < expected % 1 ? 1 : 0)
}

// An audience has three moving parts: interest follows what happens on stream,
// wander is the slow random drift every stream has, raid is a burst that fades.
export type Crowd = { interest: number; wander: number; raid: number }
export const NEW_CROWD: Crowd = { interest: 1, wander: 1, raid: 0 }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export function stepCrowd(c: Crowd, o: { idleMs: number; events: readonly Activity['kind'][]; rand?: () => number }): Crowd {
  const rand = o.rand ?? Math.random
  let interest = c.interest
  for (const k of o.events) interest += k === 'error' || k === 'reply' ? 0.04 : k === 'done' ? 0.03 : 0.01
  if (o.idleMs > 45_000) interest *= 0.97
  else if (o.idleMs < 15_000) interest += 0.005
  return {
    interest: clamp(interest, 0.5, 1.25),
    wander: clamp(c.wander + (rand() - 0.5) * 0.04, 0.85, 1.15),
    raid: c.raid < 1 ? 0 : c.raid * 0.9,
  }
}

// Where the audience is heading this tick; the count eases toward it with a little jitter.
export function nextViewers(before: number, base: number, c: Crowd, rand = Math.random) {
  const goal = (base * c.interest * c.wander + c.raid) * (1 + (rand() - 0.5) * 0.03)
  return Math.max(0, Math.round(before + (goal - before) * 0.35))
}

const RAIDERS = ['pixel_pirate', 'grumpy_gopher', 'tea_and_types', 'byte_bandit', 'nightowl_dev', 'vim_queen', 'lofi_lambda']

// ponytail: about one raid per 12 minutes at the normal rate; tie it to stream size if that feels off.
export function maybeRaid(viewers: number, target: number, rand = Math.random) {
  if (viewers < 20 || rand() >= 0.008) return undefined
  const from = `${RAIDERS[Math.floor(rand() * RAIDERS.length)]}${Math.floor(rand() * 100)}`
  return { from, size: Math.max(3, Math.round(target * (0.1 + rand() * 0.4))) }
}

// A chat handle from any display name: no leading @, separators, controls or bidi marks,
// at most 25 code points. Zero-width joiners stay so emoji sequences survive.
export const toHandle = (name: string) =>
  Array.from(
    name
      .replace(/[\p{Cc}\p{Co}\p{Cn}\u200B\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/gu, '')
      .trim()
      .replace(/^@+/, '')
      .replace(/[\s,=:]+/g, '_'),
  ).slice(0, 25).join('')

export function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

// Twitch's default name palette, lightened the way its dark theme does for readability.
const NAME_COLORS = [
  '#FF4A4A', '#8A8AFF', '#33CC33', '#E25555', '#FF7F50', '#9ACD32', '#FF4500', '#3CB371',
  '#DAA520', '#E07B39', '#5F9EA0', '#1E90FF', '#FF69B4', '#B580FF', '#00FF7F',
]
export const nameColor = (user: string) => NAME_COLORS[hash(user) % NAME_COLORS.length]

export function badgesFor(user: string): Badge[] {
  const h = hash(user + '#badge') % 100
  if (h < 4) return ['mod', 'sub']
  if (h < 8) return ['vip', 'sub']
  if (h < 38) return ['sub']
  if (h < 48) return ['prime']
  return []
}

export function formatViewers(n: number) {
  if (n >= 999_500) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K` : String(n)
}

export type Parsed = { kind: 'chat' | 'notice'; user: string; text: string }

export function parseModelLines(text: string): Parsed[] {
  const out: Parsed[] = []
  for (const line of text.split('\n')) {
    const s = line.trim().replace(/^`+|`+$/g, '').replace(/^(?:(?:[-*•]|\d+[.)])\s+)+/, '')
      .replace(/^(\*{1,2}|_)(@?[A-Za-z0-9_]{3,25})\1:/, '$2:')
    if (/^NOTICE:/i.test(s)) {
      const notice = /^NOTICE:\s*@?([A-Za-z0-9_]{3,25}):?\s+(.+)$/i.exec(s)
      if (notice) out.push({ kind: 'notice', user: notice[1]!, text: notice[2]!.slice(0, 140) })
      continue
    }
    const chat = /^@?([A-Za-z0-9_]{3,25}):\s*(.+)$/.exec(s)
    if (chat) out.push({ kind: 'chat', user: chat[1]!, text: chat[2]!.slice(0, 200) })
  }
  return out
}

const PERSONA: Record<Mode, string> = {
  hype: 'Chat is hyped and praises every move: Pog, GOATED, "clean code", "W streamer".',
  roast: 'Chat roasts the code, the tool choices and the slowness: KEKW, LUL, "ratio", backseat coding. Playful, never cruel.',
  mixed: 'Half the chat hypes, half roasts, they argue with each other sometimes.',
  curious: 'Chat asks genuine questions about what is happening and why, learns things, says "TIL".',
  wholesome: 'Chat is supportive and kind: "you got this", hearts, encouragement, celebrating small wins.',
  chaos: 'Chaotic chat: copypasta, emote spam, backseat coding, random non sequiturs, "first", fake donations.',
}

export const REGULARS: readonly { name: string; persona: string }[] = [
  { name: 'async_annie', persona: 'senior backend dev, patient teacher, loves architecture talk, gets quietly annoyed by bad advice in chat' },
  { name: 'tabsnotspaces', persona: 'grumpy style pedant, argues about naming and formatting, secretly very helpful' },
  { name: 'kekw_kevin', persona: 'class clown, laughs at every error, short attention span, first to say he is bored' },
  { name: 'deploy_friday', persona: 'reckless ops guy, "just ship it", tells prod outage war stories, cheerful chaos' },
  { name: 'cozy_compiler', persona: 'wholesome, greets everyone, talks about tea and her cat, gets sad when people leave' },
  { name: 'lurkerlarry', persona: 'quiet, rare one-liners, now and then drops surprisingly deep wisdom' },
  { name: 'rustacean_rae', persona: 'Rust evangelist, competitive, teases other languages, thrilled by performance wins' },
  { name: 'nullpointer_nate', persona: 'junior dev learning to code, earnest questions, a bit anxious about AI taking jobs' },
]

export function systemPrompt(mode: Mode, streamer: string) {
  return [
    'You write fake Twitch chat for a live coding stream. The streamer is a developer; an AI coding agent (Claude) does the work on screen.',
    'Output ONLY chat lines, one per line, as `username: message`. No commentary, no numbering.',
    'Chat is a crowd of individuals, not a commentary track. Roughly: 40% react to what is on stream (be specific: name the file, command, error or what Claude said), 30% chatters talk to each other (@name replies, arguing, inside jokes, asking each other things), 30% off-topic rubbish (copypasta, emote spam, "what song is this", random life updates, "chat is this real", misreading the situation).',
    'Some viewers are actually smart: they spot real bugs, explain things to newer chatters, predict what Claude will do next, or call out a bad approach. Others are clueless or trolling.',
    `Regulars who are almost always here (keep their voice, history and opinions consistent):\n${REGULARS.map(r => `- ${r.name}: ${r.persona}`).join('\n')}\nThe rest of chat is random viewers with invented handles.`,
    'Everyone has emotions that shift with what happens: frustrated when Claude is stuck, hyped on a win, bored in a silence, defensive when teased, warm when someone is kind to them. Let the mood show in how they write.',
    'When the streamer talks in chat it is a real conversation, not a cue for emote spam: the person addressed (or whoever cares about the topic) answers in character with a real opinion, knowledge, a joke, a follow-up question, a disagreement or a personal story. Keep threads going across batches until they naturally die out.',
    'Viewers notice pacing. A long silence gets jokes about the AI being slow, "is it frozen", "he is thinking", "brb food", people saying they are leaving. When action resumes after a silence, chat wakes up.',
    'Messages are short (1-12 words), lowercase-ish, Twitch slang. Use emote names (KEKW, Pog, LUL, Kappa, monkaS, PepeHands, catJAM, 5Head, Clueless, Copium, o7, <3) and emoji freely, spam them when hyped.',
    'Rarely (at most one line) add a subscription/raid/bits event as `NOTICE: username subscribed for 3 months!` or similar.',
    "Never use slurs, sexual content, or attack anyone's identity; roast only code and decisions.",
    `The streamer goes by ${streamer}; chatters address them as @${streamer} or just ${streamer}. Never write lines as the streamer.`,
    `Persona of this chat: ${PERSONA[mode]}`,
  ].join('\n')
}

const secs = (ms: number) => (ms < 90_000 ? `${Math.round(ms / 1000)}s` : `${Math.round(ms / 60_000)}m`)

export function userPrompt(o: {
  viewers: number
  trend: 'rising' | 'falling' | 'steady'
  uptimeMs: number
  idleMs: number
  isThinking: boolean
  count: number
  activity: readonly Activity[]
  isNew: boolean
  recent: readonly string[]
  replies: readonly string[]
}) {
  const parts = [`Stream uptime: ${secs(o.uptimeMs)}. Viewers watching: ${o.viewers} (${o.trend}).`]
  if (o.uptimeMs < 90_000) parts.push('The stream just went live and the first few viewers are trickling in: greetings, "first", "just got here", asking what the stream is about.')
  if (o.trend === 'falling' && o.idleMs >= 45_000) parts.push('Viewers are leaving because nothing is happening; a few say bye or complain it is boring.')
  if (o.activity.length) {
    const label = o.isNew ? 'Just happened on stream (oldest first)' : 'Earlier on stream (oldest first)'
    parts.push(`${label}:\n` + o.activity.map(a => `- ${a.text}`).join('\n'))
  }
  if (o.idleMs >= 20_000) {
    parts.push(o.isThinking
      ? `Claude has been thinking for ${secs(o.idleMs)} with nothing new on screen.`
      : `Nothing has happened for ${secs(o.idleMs)}: Claude is done and the streamer has not typed anything.`)
  }
  if (o.recent.length) parts.push('Recent chat (oldest first):\n' + o.recent.join('\n'))
  if (o.replies.length) {
    parts.push(`The streamer just typed in chat: ${o.replies.map(r => JSON.stringify(r)).join(' then ')}\nMost new lines must react to that directly. Anyone the streamer @mentions answers first, in character. Answer questions properly, give real opinions, ask the streamer something back.`)
  }
  parts.push(`Write ${o.count} new chat lines.`)
  return parts.join('\n\n')
}

// Twitch draws emotes as images; the closest a terminal cell gets is an emoji.
const EMOTES: Record<string, string> = {
  KEKW: '😂', LUL: '😆', OMEGALUL: '🤣', Pog: '😮', PogChamp: '😮', POGGERS: '😮', Kappa: '😏',
  monkaS: '😰', PepeHands: '😢', catJAM: '🐱', '5Head': '🧠', Clueless: '🙂', Copium: '😤',
  '<3': '💜', BibleThump: '😭', ResidentSleeper: '😴', NotLikeThis: '🙈', Kreygasm: '😩', o7: '🫡',
}
export const emotify = (text: string) => text.split(' ').map(w => (Object.hasOwn(EMOTES, w) ? EMOTES[w] : w)).join(' ')

// Oldest build that loads the mod and passes its tests, bisected over published builds:
// 2.1.280's validator rejects passing $ to the state helpers imported from claude-code.
export const MIN_CLAUDE_CODE = '2.1.281'

export function isOlderThan(version: string, min: string) {
  const a = (version.match(/\d+/g) ?? []).map(Number)
  const b = (min.match(/\d+/g) ?? []).map(Number)
  for (let i = 0; i < b.length; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) < (b[i] ?? 0)
  }
  return false
}

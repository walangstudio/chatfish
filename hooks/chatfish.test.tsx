import { expect, mock, test } from 'claude-code/testing'

import { cannedChat, cannedLine, cannedName, subject } from './canned'

import { MIN_CLAUDE_CODE, NEW_CROWD, batchSize, isOlderThan, emotify, liveViewers, maybeRaid, nextViewers, parseArgs, parseConfig, parseModelLines, stepCrowd, toHandle, formatViewers, fromSaved, systemPrompt, userPrompt } from './chat'

const PANE = { component: 'Pane', requestId: 'chatfish', props: { title: 'Stream Chat', isFocused: false, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 200 }, view: {} }, viewport: { columns: 40, rows: 200 } } as const
const run = (args: string) => ({ command: 'chatfish', args, origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } }) as const

test('parses commands order-free with aliases', async () => {
  expect(parseArgs('live roast 5k frequent')).toEqual({ kind: 'on', patch: { mode: 'roast', viewers: 5000, rate: 'frequent' } })
  expect(parseArgs('start 300 less praising')).toEqual({ kind: 'on', patch: { viewers: 300, rate: 'quiet', mode: 'hype' } })
  expect(parseArgs('offline')).toEqual({ kind: 'off' })
  expect(parseArgs('reply  hi chat ')).toEqual({ kind: 'reply', text: 'hi chat' })
  expect(parseArgs('mode curious')).toEqual({ kind: 'set', patch: { mode: 'curious' } })
  expect(parseArgs('')).toEqual({ kind: 'status' })
  expect(parseArgs('on banana').kind).toBe('error')
  expect(parseArgs('on 0').kind).toBe('error')
  expect(parseArgs('reply').kind).toBe('error')
})

test('parses model lines and notices, drops junk', async () => {
  const out = parseModelLines('1. kekw_kev: KEKW\nsure here you go\n- pog_dev: Pog\nNOTICE: lurker42 subscribed for 3 months!')
  expect(out).toEqual([
    { kind: 'chat', user: 'kekw_kev', text: 'KEKW' },
    { kind: 'chat', user: 'pog_dev', text: 'Pog' },
    { kind: 'notice', user: 'lurker42', text: 'subscribed for 3 months!' },
  ])
  expect(batchSize('normal', 200)).toBe(4)
  expect(batchSize('normal', 0)).toBe(0)
  expect(cannedChat('roast', 3, undefined, () => 0.5).length).toBe(3)
})

test('live, reply and off drive the pane; model failure falls back to canned', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const opened: string[] = []
  on('ui.open', (_$, e) => { opened.push(e.id); return { value: { isPlaced: true } } })
  on('ui.close', (_$, e) => { opened.splice(opened.indexOf(e.id), 1); return { value: undefined } })
  on('ui.status', () => ({ value: undefined }))
  on('model.complete', () => ({ value: { isAnswered: false, reason: 'api-error', status: 529, error: 'overloaded', usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } } }))

  const live = await $.command.run(run('live roast 2k frequent'))
  expect(live.text).toContain('LIVE')
  expect(opened).toEqual(['chatfish'])
  await clock.advance(3000)
  await $.command.run(run('reply hello chat'))
  await clock.advance(3000)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'chatfish', surface, ...PANE })
    expect(await ui.find({ type: 'Text', text: 'STREAM CHAT' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /hello chat/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Welcome to the chat room/ })).toBeDefined()
    await ui.unmount()
  }

  const off = await $.command.run(run('off'))
  expect(off.text).toContain('offline')
  expect(opened).toEqual([])
  const ui = await $.ui.mount({ plugin: 'chatfish', surface: 'terminal', ...PANE })
  expect(await ui.find({ type: 'Text', text: /Stream is offline/ })).toBeDefined()
  await ui.unmount()
})

test('draws Twitch-style rows: notice card, mention highlight, desktop svg badges', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.close', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('model.complete', () => ({ value: { isAnswered: true, text: 'kekw_kev: KEKW nice\npog_dev: @streamer hi\nNOTICE: lurker42 subscribed for 3 months!', usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } } }))
  await $.command.run(run('live'))
  await clock.advance(130000)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'chatfish', surface, ...PANE })
    expect(await ui.find({ type: 'Text', text: /😂 nice/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /lurker42 subscribed for 3 months/ })).toBeDefined()
    if (surface === 'desktop') expect(await ui.find({ type: 'Svg' })).toBeDefined()
    await ui.unmount()
  }
})

test('emotes render as emoji, other words untouched', async () => {
  expect(emotify('KEKW that bug <3 Kappab')).toBe('😂 that bug 💜 Kappab')
})

test('stream starts empty and viewers ramp up to the target', async () => {
  expect(liveViewers(1200, 0)).toBe(0)
  expect(liveViewers(1200, 60_000)).toBe(300)
  expect(liveViewers(1200, 120_000)).toBe(1200)
  expect(liveViewers(1200, 999_999)).toBe(1200)
  expect(batchSize('normal', 5, () => 0.99)).toBe(0)
})

test('prompt tells chat about silence, leaving viewers, regulars and the streamer', async () => {
  const base = { viewers: 800, trend: 'steady', uptimeMs: 600_000, idleMs: 0, isThinking: false, count: 4, activity: [], isNew: false, recent: [], replies: [] } as const
  expect(userPrompt({ ...base, idleMs: 95_000, isThinking: true })).toContain('Claude has been thinking for 2m')
  expect(userPrompt({ ...base, idleMs: 30_000 })).toContain('Nothing has happened for 30s')
  expect(userPrompt({ ...base, trend: 'falling', idleMs: 60_000 })).toContain('Viewers are leaving')
  expect(userPrompt(base)).not.toContain('thinking for')
  expect(userPrompt({ ...base, replies: ['@async_annie monorepo or not?'] })).toContain('Anyone the streamer @mentions answers first')
  expect(systemPrompt('mixed', 'niño')).toContain('async_annie: senior backend dev')
  expect(systemPrompt('mixed', 'niño')).toContain('@niño')
})

test('config command parses key=value and key: value lists', async () => {
  expect(parseConfig('name=niño viewers=5k')).toEqual({ streamer: 'niño', viewers: 5000 })
  expect(parseConfig('nickname: @CodeCat, audience: 300, mode: roast, rate: spam')).toEqual({ streamer: 'CodeCat', viewers: 300, mode: 'roast', rate: 'frequent' })
  expect(parseConfig('name=auto')).toEqual({ streamer: '' })
  expect(parseConfig('viewers=lots')).toBe('unknown option "lots"')
  expect(parseConfig('mode=frequent')).toBe('bad value for mode: "frequent"')
  expect(parseConfig('colour=red')).toBe('unknown setting "colour"')
  expect(parseConfig('name=two words')).toContain('no spaces')
  expect(parseConfig('')).toBe('nothing to set')
  expect(parseArgs('config viewers=9000')).toEqual({ kind: 'config', patch: { viewers: 9000 } })
})

test('config while live renames the streamer in chat', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.close', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('model.complete', () => ({ value: { isAnswered: false, reason: 'empty-reply', usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } } }))
  await $.command.run(run('live'))
  const set = await $.command.run(run('config name=CodeCat viewers=4k'))
  expect(set.text).toContain('CodeCat, mixed, 4K viewers, normal (applied live)')
  await $.command.run(run('reply hi chat'))
  const ui = await $.ui.mount({ plugin: 'chatfish', surface: 'terminal', ...PANE })
  expect(await ui.find({ type: 'Text', text: 'CodeCat' })).toBeDefined()
  await ui.unmount()
  await $.command.run(run('off'))
})

test('audience rises with action, bleeds in silence, wanders and gets raided', async () => {
  const mid = () => 0.5
  const busy = stepCrowd(NEW_CROWD, { idleMs: 5_000, events: ['error', 'reply'], rand: mid })
  expect(Math.round(busy.interest * 1000)).toBe(1085)
  let bored = NEW_CROWD
  for (let i = 0; i < 100; i++) bored = stepCrowd(bored, { idleMs: 120_000, events: [], rand: mid })
  expect(bored.interest).toBe(0.5)
  let drift = NEW_CROWD
  for (let i = 0; i < 100; i++) drift = stepCrowd(drift, { idleMs: 20_000, events: [], rand: () => 1 })
  expect(drift.wander).toBe(1.15)
  expect(stepCrowd({ ...NEW_CROWD, raid: 100 }, { idleMs: 20_000, events: [], rand: mid }).raid).toBe(90)
  expect(nextViewers(1000, 1000, NEW_CROWD, mid)).toBe(1000)
  expect(nextViewers(1000, 1000, { ...NEW_CROWD, interest: 0.5 }, mid)).toBe(825)
  expect(maybeRaid(500, 1000, () => 0.5)).toBeUndefined()
  expect(maybeRaid(10, 1000, () => 0)).toBeUndefined()
  expect(maybeRaid(500, 1000, () => 0)).toEqual({ from: 'pixel_pirate0', size: 100 })
})

test('flags Claude Code builds older than the minimum', async () => {
  expect(isOlderThan('2.1.260', MIN_CLAUDE_CODE)).toBe(true)
  expect(isOlderThan('2.0.999', MIN_CLAUDE_CODE)).toBe(true)
  expect(isOlderThan('2.1.280', MIN_CLAUDE_CODE)).toBe(true)
  expect(isOlderThan('2.1.281', MIN_CLAUDE_CODE)).toBe(false)
  expect(isOlderThan('2.1.289 (Claude Code)', MIN_CLAUDE_CODE)).toBe(false)
  expect(isOlderThan('3.0.0', MIN_CLAUDE_CODE)).toBe(false)
})

test('canned fallback has thousands of distinct lines and names', async () => {
  const kinds = ['tool', 'error', 'done', 'reply', 'said', 'prompt', 'raid'] as const
  const lines = new Set<string>()
  const names = new Set<string>()
  for (let i = 0; i < 20_000; i++) {
    const last = { seq: 1, at: 0, kind: kinds[i % kinds.length]!, text: 'Agent runs Edit: src/app/router.ts' }
    lines.add(cannedLine((['hype', 'roast', 'mixed', 'curious', 'wholesome', 'chaos'] as const)[i % 6]!, last))
    names.add(cannedName())
  }
  expect(lines.size).toBeGreaterThan(1000)
  expect(names.size).toBeGreaterThan(1000)
  expect([...lines].some(l => l.includes('router.ts'))).toBe(true)
})

test('prototype keys are not emotes, modes or settings', async () => {
  expect(emotify('why is the constructor empty')).toBe('why is the constructor empty')
  expect(parseArgs('on constructor').kind).toBe('error')
  expect(parseArgs('toString').kind).toBe('error')
  expect(parseConfig('constructor=1')).toBe('unknown setting "constructor"')
})

test('handles that start with digits survive list-marker stripping', async () => {
  expect(parseModelLines('404_dev: lol\n5Head_fan: W\n2. real_one: hi')).toEqual([
    { kind: 'chat', user: '404_dev', text: 'lol' },
    { kind: 'chat', user: '5Head_fan', text: 'W' },
    { kind: 'chat', user: 'real_one', text: 'hi' },
  ])
})

test('config keeps comma-grouped numbers and rejects junk', async () => {
  expect(parseConfig('viewers=5,000')).toEqual({ viewers: 5000 })
  expect(parseConfig('viewers: 1,200, mode: roast')).toEqual({ viewers: 1200, mode: 'roast' })
  expect(typeof parseConfig('name=x, junk, rate=fast')).toBe('string')
  expect(parseConfig('name=cool,dude')).toContain('no spaces, commas')
  expect(typeof parseConfig('viewers=10 junk')).toBe('string')
})

test('display names become safe handles', async () => {
  expect(toHandle('Nino Tancardoso')).toBe('Nino_Tancardoso')
  expect(toHandle('niño')).toBe('niño')
  expect(toHandle('a\u200Bb')).toBe('ab')
  const emoji = toHandle('😀'.repeat(13))
  expect(Array.from(emoji).length).toBe(13)
  expect(emoji.includes('\uD83D\uD83D')).toBe(false)
  expect(Array.from(toHandle('x'.repeat(40))).length).toBe(25)
})

test('canned subject only picks files from tool events', async () => {
  const ev = (kind: 'tool' | 'said' | 'error', text: string) => ({ seq: 1, at: 0, kind, text })
  expect(subject(ev('tool', 'Agent runs Edit: hooks/register.tsx'))).toBe('register.tsx')
  expect(subject(ev('tool', 'Agent runs Bash: npm test 2>&1'))).toBeUndefined()
  expect(subject(ev('error', 'Bash failed: 3 tests failed in router.spec.ts'))).toBe('router.spec.ts')
  expect(subject(ev('said', 'Claude said: "All tests pass."'))).toBeUndefined()
})

test('model output with bold handles and odd notices still parses', async () => {
  expect(parseModelLines('**kekw_kevin**: lol\n- 1. abc_d: x\nNOTICE: user42: subscribed for 2 months!')).toEqual([
    { kind: 'chat', user: 'kekw_kevin', text: 'lol' },
    { kind: 'chat', user: 'abc_d', text: 'x' },
    { kind: 'notice', user: 'user42', text: 'subscribed for 2 months!' },
  ])
})

test('round-3 parsing edge cases', async () => {
  expect(typeof parseConfig('name=xmode=roast')).toBe('string')
  expect(parseConfig('name=niño mode=roast')).toEqual({ streamer: 'niño', mode: 'roast' })
  expect(parseConfig('name=a$&b')).toEqual({ streamer: 'a$&b' })
  expect(toHandle('@nino')).toBe('nino')
  expect(toHandle('dev 🎮')).toBe('dev_🎮')
  expect(parseModelLines('`kekw_kevin: lol`\n*annie_dev*: ok\nNOTICE: 🎉 lurker42 subscribed!\nNOTICE: ab subscribed')).toEqual([
    { kind: 'chat', user: 'kekw_kevin', text: 'lol' },
    { kind: 'chat', user: 'annie_dev', text: 'ok' },
  ])
  const ev = { seq: 1, at: 0, kind: 'tool' as const, text: 'Agent runs Edit: F:\\opt\\projs\\hooks\\register.tsx' }
  expect(subject(ev)).toBe('register.tsx')
})

test('viewer counts read like Twitch at every size', async () => {
  expect(formatViewers(999)).toBe('999')
  expect(formatViewers(1200)).toBe('1.2K')
  expect(formatViewers(45_000)).toBe('45K')
  expect(formatViewers(999_499)).toBe('999K')
  expect(formatViewers(999_500)).toBe('1M')
  expect(formatViewers(1_000_000)).toBe('1M')
  expect(formatViewers(1_500_000)).toBe('1.5M')
})

test('only an idle falling audience is blamed on boredom', async () => {
  const base = { viewers: 800, trend: 'falling', uptimeMs: 600_000, idleMs: 5_000, isThinking: true, count: 4, activity: [], isNew: true, recent: [], replies: [] } as const
  expect(userPrompt(base)).not.toContain('Viewers are leaving')
  expect(userPrompt({ ...base, idleMs: 60_000 })).toContain('Viewers are leaving')
})

test('saved settings are re-checked before use', async () => {
  expect(fromSaved({ mode: 'roast', viewers: 5000, rate: 'quiet', streamer: 'CodeCat' })).toEqual({ mode: 'roast', viewers: 5000, rate: 'quiet', streamer: 'CodeCat' })
  expect(fromSaved({ mode: 'constructor', viewers: -4, rate: 7, streamer: 'two words' })).toEqual({})
  expect(fromSaved(null)).toEqual({})
  expect(fromSaved('junk')).toEqual({})
})

test('settings survive a new session through the store', async ($, on) => {
  mock.clock(on)
  mock.store(on, { settings: { mode: 'roast', viewers: 4000, rate: 'quiet', streamer: 'CodeCat' } })
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.close', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  const status = await $.command.run(run('status'))
  expect(status.text).toContain('CodeCat, roast, 4K viewers, quiet')
  await $.command.run(run('config mode=wholesome'))
  const back = await $.command.run(run('status'))
  expect(back.text).toContain('wholesome')
})

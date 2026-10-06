import type { Activity, Mode } from '../types'

// Offline chat for when Haiku is unavailable or a tick skips it. Hand-written lines
// give the voice, templates with interchangeable parts give the volume.

type Rand = () => number
const pick = <T,>(xs: readonly T[], rand: Rand) => xs[Math.floor(rand() * xs.length)]!

const EMOTES = [
  'KEKW', 'LUL', 'OMEGALUL', 'Pog', 'PogChamp', 'POGGERS', 'Kappa', 'monkaS', 'PepeHands', 'catJAM',
  '5Head', 'Clueless', 'Copium', 'o7', '<3', 'BibleThump', 'ResidentSleeper', 'NotLikeThis', 'Kreygasm',
]
const LAUGH = ['KEKW', 'LUL', 'OMEGALUL', 'LMAO', 'lmaooo', 'XD', 'ICANT', 'HAHAHA', 'lol', 'dead']
const HYPE = ['Pog', 'PogChamp', 'POGGERS', 'LETS GOOO', 'W', 'HUGE', 'insane', 'GG', 'sheesh']
const SAD = ['PepeHands', 'BibleThump', 'NotLikeThis', 'F', 'oof', 'pain', 'rip', 'monkaS', 'Sadge']
const NEUTRAL = [
  'KEKW', 'LUL', 'Kappa', '5Head', 'Clueless', 'catJAM', 'o7', 'lol', 'fr', 'ngl', 'tbh', 'hmm', 'interesting',
  'Copium', 'monkaS', 'OMEGALUL', 'true', 'real', 'facts', 'huh', 'wild', 'noted', 'sheesh', 'ok', 'bro',
]
const WARM = ['<3', 'catJAM', 'o7', 'Pog', 'love it', 'so wholesome', 'proud of you', 'nice']
const GREET = ['hi', 'hello', 'yo', 'hey', 'sup', 'hiii', 'heyo', 'good morning', 'gm', 'evening', 'howdy', 'hola', 'oi', 'wassup', 'heya']
const WHO = [
  'chat', 'everyone', 'streamer', 'gamers', 'nerds', 'friends', 'bestie', 'fam', 'lurkers', 'mods',
  'devs', 'coders', 'night owls', 'regulars', 'new people', 'besties', 'legends', 'gremlins', 'goblins', 'team',
]
const LANGS = [
  'rust', 'go', 'python', 'typescript', 'java', 'c++', 'zig', 'haskell', 'php', 'lua', 'elixir', 'kotlin',
  'c#', 'ruby', 'swift', 'scala', 'ocaml', 'clojure', 'dart', 'bash',
]
// Two different languages per line; "rust > rust" is not a take.
const VERSUS = ['>', 'is better than', 'is just worse than', 'could never beat', 'vs'].flatMap(cmp =>
  LANGS.flatMap(a => LANGS.filter(b => b !== a).map(b => `${a} ${cmp} ${b}`)),
)
// Singular subjects only, so "is" and "looks" always agree.
const THINGS = [
  'the test suite', 'the build', 'that regex', 'the type system', 'the linter', 'the deploy', 'the database', 'the cache',
  'the CI', 'the documentation', 'that function', 'the config', 'the API', 'the merge', 'the migration', 'the readme',
  'that loop', 'the error handling', 'the naming', 'the commit message', 'that if statement', 'the indentation',
  'the PR', 'the stack trace', 'the log output', 'the dependency tree', 'node_modules', 'the lockfile', 'the env file',
  'the dockerfile', 'the schema', 'the query', 'the retry logic', 'that one comment', 'the TODO list', 'the git history',
  'the folder structure', 'that hotfix', 'the pipeline', 'the test runner', 'the router', 'the parser', 'the CLI',
  'the frontend', 'the backend', 'the auth flow', 'the release', 'that branch', 'the diff', 'this codebase',
]
const OPEN = [
  'ok but', 'ngl', 'honestly', 'lowkey', 'highkey', 'not gonna lie', 'bro', 'chat', 'wait', 'yo',
  'hold on', 'real talk', 'actually', 'fr', 'tbh', 'no way', 'bruh', 'dude', 'hmm', 'ok',
]
const PRAISE = [
  'is cooking', 'is goated', 'is beautiful', 'is lowkey genius', 'is peak engineering', 'is actually clean',
  'deserves a raise', 'is art', 'is immaculate', 'sparks joy', 'is a vibe', 'just works', 'is so smooth',
  'is chef kiss', 'is the cleanest thing today', 'is elite', 'looks great', 'is surprisingly good', 'is a masterpiece',
  'is how it should be done',
]
const SHADE = [
  'looks cursed', 'is held together by tape', 'is a crime', 'makes no sense', 'needs a rewrite', 'will break in prod',
  'is giving 2009', 'is suspicious', 'passed somehow', 'scares me', 'is pure chaos', 'needs therapy', 'is why prod is down',
  'is spaghetti', 'hurts my eyes', 'is legacy already', 'is 90% vibes', 'is fine trust', 'is a war crime', 'is cooked',
]
const NICE_ADJ = ['clean', 'beautiful', 'goated', 'elegant', 'blessed', 'cozy', 'pristine', 'crisp', 'tidy', 'slick']
const MEAN_ADJ = ['cursed', 'sus', 'scary', 'mid', 'ancient', 'chaotic', 'questionable', 'illegal', 'unhinged', 'feral']
const ADJ = [...NICE_ADJ, ...MEAN_ADJ]
const SNACK = [
  'ramen', 'coffee', 'tea', 'pizza', 'cereal', 'an energy drink', 'toast', 'leftovers', 'dumplings', 'a sandwich',
  'popcorn', 'cold pizza', 'boba', 'instant noodles', 'chips', 'a burrito', 'sushi', 'pancakes', 'a salad', 'cookies',
]
const TIMES = ['5 min', '2 hours', 'the whole stream', 'all week', 'three years', 'forever', 'a decade', '10 seconds', 'an hour', 'all day', 'like 20 min', '3 streams']
const PLACES = [
  'brazil', 'germany', 'the philippines', 'canada', 'the uk', 'japan', 'india', 'mexico', 'france', 'poland',
  'australia', 'korea', 'spain', 'italy', 'sweden', 'argentina', 'nigeria', 'vietnam', 'turkey', 'the netherlands',
]
const CHECKIN = ['greetings from', 'watching from', 'hello from', 'its 3am in', 'chilling in', 'up late in', 'lunch break in', 'raining in']
const QSTART_CURIOUS = ['what is', 'who wrote', 'when did we change', 'can someone explain']
const QSTART = [...QSTART_CURIOUS, 'why is', 'wait why is', 'who approved', 'is anyone else scared of']
const QEND = ['?', '??', '? genuinely asking', '? asking for a friend', 'lol', '?!']
const BRB = ['brb getting', 'back with', 'just grabbed', 'ok making', 'having', 'got']
const WATCH = ['watching', 'lurking', 'here', 'vibing', 'learning', 'procrastinating']

type Part = string | readonly string[]

// About 60% of real messages end with nothing; the rest end with a word or emote that fits the mood.
export const endings = (words: readonly string[]) => [...Array<string>(Math.round(words.length * 1.5)).fill(''), ...words]

// How a mode feels about the code: hype and wholesome only praise, roast only shades, the rest mix.
type Tone = 'nice' | 'mean' | 'any'
const toneOf = (mode: Mode): Tone => (mode === 'hype' || mode === 'wholesome' ? 'nice' : mode === 'roast' ? 'mean' : 'any')

// The parts that carry a mood: what chat says about the code and how it signs off.
function moodOf(mode: Mode) {
  const tone = toneOf(mode)
  // Mixed modes pick praise or shade per line, so they sign off with something that fits either.
  const end =
    mode === 'hype' ? HYPE
    : mode === 'wholesome' ? WARM
    : mode === 'roast' ? [...LAUGH, ...SAD]
    : NEUTRAL
  return {
    tone,
    verdict: tone === 'nice' ? PRAISE : tone === 'mean' ? SHADE : [...PRAISE, ...SHADE],
    adj: tone === 'nice' ? NICE_ADJ : tone === 'mean' ? MEAN_ADJ : ADJ,
    end: endings(end),
  }
}

// Each template is a row of fixed text and word lists; one line picks one word from every list.
function templatesFor(mode: Mode): readonly (readonly Part[])[] {
  const { tone, verdict, adj, end } = moodOf(mode)
  const nice = tone === 'nice'
  return [
    [OPEN, THINGS, verdict, end],
    [THINGS, verdict, end],
    [THINGS, 'looking', adj, end],
    [GREET, WHO, end],
    [CHECKIN, PLACES, end],
    [BRB, SNACK, end],
    ['been', WATCH, 'for', TIMES, end],
    [nice ? QSTART_CURIOUS : QSTART, THINGS, QEND],
    [adj, 'stream today', end],
    ['the vibes are', adj, end],
    // Language fights and digs at the code are for modes that are allowed to be rude.
    ...(nice
      ? []
      : ([[VERSUS, end], ['this would be 3 lines in', LANGS, end], ['just rewrite it in', LANGS, end], ['who touched', THINGS, end]] as const)),
  ]
}

const sizeOf = (t: readonly Part[]) =>
  t.reduce((m, p) => (typeof p === 'string' ? m : m * new Set(p).size), 1)

type Table = { templates: readonly (readonly Part[])[]; weights: number[]; total: number }

// Built on first use per mode, so any mode the type allows gets a table.
// Big templates are picked more often than small ones (by the square root of their size),
// so a greeting does not come up as often as a full sentence about the code.
const tables: Partial<Record<Mode, Table>> = {}
function tableFor(mode: Mode): Table {
  return (tables[mode] ??= (() => {
    const templates = templatesFor(mode)
    const weights = templates.map(t => Math.sqrt(sizeOf(t)))
    return { templates, weights, total: weights.reduce((a, b) => a + b, 0) }
  })())
}

// Template combinations available in a mode: the sum over templates of their lists' distinct sizes multiplied.
export const templateCombos = (mode: Mode) => tableFor(mode).templates.reduce((n, t) => n + sizeOf(t), 0)

function pickTemplate(mode: Mode, rand: Rand) {
  const { templates, weights, total } = tableFor(mode)
  let left = rand() * total
  for (let i = 0; i < templates.length; i++) {
    left -= weights[i]!
    if (left < 0) return templates[i]!
  }
  return templates[templates.length - 1]!
}

const fill = (t: readonly Part[], r: Rand) =>
  t.map(p => (typeof p === 'string' ? p : pick(p, r))).filter(Boolean).join(' ').replace(/ \?/g, '?')

const COMMON = [
  'first', 'second', 'is this live?', 'what are we building', 'what is he making', 'chat is this real',
  'what song is this', 'song name?', 'any% speedrun', 'can we get a W in chat', 'W', 'L', 'ratio',
  'true', 'real', 'so true', 'facts', 'based', 'cringe', 'mid', 'no shot', 'bro what', 'wait what',
  'huh', '???', 'lmao', 'i see', 'interesting', 'hmm', 'ok', 'chat is sleeping', 'who is this',
  'new here', 'just got here', 'followed', 'raid incoming?', 'love the setup', 'what font is that',
  'what theme is this', 'what keyboard', 'dark mode gang', 'light mode users KEKW', 'vim or emacs',
  'tabs or spaces', 'hydrate', 'posture check', 'stretch break?', 'go to sleep', 'what time is it there',
  'greetings from brazil', 'hello from germany', 'philippines represent', 'canada here', 'uk chat',
  'its 3am here', 'should be studying', 'skipping class for this', 'my boss thinks im working',
  'cooking', 'he cooking', 'let him cook', 'trust the process', 'its giving senior dev', 'peak content',
  'this is my roman empire', 'certified banger', 'chat behave', 'mods?', 'ban him', 'unban him',
  'who let him code', 'touch grass', 'never touching grass', 'average tuesday', 'actual wizard',
  'ok but why', 'no thoughts head empty', 'brain hurts', 'my brain is melting', 'i understood nothing',
  'i understood everything trust', 'taking notes', 'screenshotting this', 'clipped', 'clip it',
  'someone clip that', 'that was smooth', 'smoothest stream', 'calm stream today', 'cozy stream',
]

const BY_MODE: Record<Mode, readonly string[]> = {
  hype: [
    'GOATED streamer', 'clean code no cap', '10x dev fr', 'bro is cracked', 'this is art', 'masterclass',
    'insane speed', 'teach me', 'senior engineer energy', 'big brain move', 'flawless', 'hire this man',
    'industry should be scared', 'thats how you do it', 'textbook', 'better than my whole team',
  ],
  roast: [
    'bro is still thinking LUL', 'my grandma codes faster', 'skill issue', 'did he just... KEKW',
    'just use a for loop 5Head', 'stack overflow copy paste speedrun', 'who taught you this',
    'my linter is crying', 'this code has a smell', 'git blame is gonna be fun', 'the AI is carrying',
    'AI doing all the work streamer just vibing', 'readme driven development', 'tests? never heard of em',
    'works on my machine energy', 'technical debt speedrun', 'this is why prod is down',
  ],
  mixed: [
    'is this good or bad', 'he cooking or burning?', 'half of chat says W half says L',
    'honestly not bad', 'could be worse', 'ive seen worse at work', 'kinda clean kinda cursed',
    'respect but why', 'bold strategy', 'it works so its fine', 'controversial but ok',
  ],
  curious: [
    'what does that do?', 'why that approach?', 'is that a hook?', 'TIL', 'what lang is this',
    'how long does this usually take?', 'can someone explain', 'whats the plan here', 'why not use a library',
    'how does the AI know what to do', 'is this safe?', 'what happens if it fails', 'whats a mod',
    'is this open source', 'where can I learn this', 'how did you set this up',
  ],
  wholesome: [
    'you got this <3', 'love these streams', 'take your time', 'nice progress!', 'hi chat <3',
    'so calm, love it', 'proud of you', 'small wins count', 'drink some water <3', 'this chat is so nice',
    'best part of my day', 'hope everyone is doing ok', 'sending good vibes', 'good luck with the build',
  ],
  chaos: [
    'FIRST', 'catJAM catJAM catJAM', 'type !discord', 'can you play minecraft', 'chat is this real',
    'Copium', 'monkaS monkaS', '!uptime', '!song', 'BAN ME', 'I AM THE CAPTAIN NOW', 'flashbang incoming',
    'dono goal when', 'kappa kappa kappa', 'react to this', 'my cat walked on my keyboard asdfgh',
    'every day I wake up and choose violence', 'its free real estate', 'spam o7 for the build o7 o7',
  ],
}

const REACT: Partial<Record<Activity['kind'], readonly string[]>> = {
  tool: [
    'here we go', 'TERMINAL ARC', 'its doing something monkaS', 'watching closely', 'cooking', 'go go go',
    'the AI is typing', 'lock in', 'focus mode', 'speedrun', 'trust', 'oh he is actually doing it',
  ],
  error: [
    'KEKW error', 'F', 'PepeHands', 'thats red chat', 'monkaS it broke', 'NotLikeThis', 'red text arc',
    'error any%', 'its fine its fine', 'who could have seen this coming', 'skill issue', 'read the error',
    'have you tried turning it off and on', 'F in chat', 'the stack trace is longer than the code',
    'you got this', 'happens to the best of us', 'debug time', 'easy fix probably',
  ],
  done: [
    'GG', 'GGs', 'did it work??', 'ship it', 'o7', 'W', 'merge it', 'deploy on friday', 'clean', 'next',
    'what now', 'that was fast', 'ez', 'he did it', 'okay that was impressive',
  ],
  reply: ['hi!', 'he reads chat Pog', 'streamer noticed me', 'LUL', 'true', 'real', 'facts', 'agreed', 'no way'],
  said: ['the AI said it like its easy', 'trust the AI', 'chat GPT who', 'AI explained it better than my prof', 'big words'],
  prompt: ['new task Pog', 'oh this should be fun', 'here we go again', 'good luck', 'that sounds hard', 'easy'],
  raid: ['RAID', 'welcome raiders', 'hi raiders <3', 'RAID HYPE', 'welcome in', 'raiders say hi'],
  subagent: [
    'minions deployed', 'sending in the clones', 'delegation king', 'the AI hired an intern', 'subagent arc',
    'agents all the way down', 'it made a friend', 'team of AIs Pog', 'outsourcing speedrun', 'go little guy go',
    'the subagent is cooking', 'report back soldier o7', 'multitasking legend', 'how many of them are there monkaS',
  ],
}

// Shared lines that only fit one side: nice modes never mock, roast never gushes.
const SPICY = new Set([
  'L', 'ratio', 'cringe', 'mid', 'light mode users KEKW', 'ban him', 'who let him code', 'touch grass',
  'KEKW error', 'skill issue', 'read the error', 'who could have seen this coming', 'error any%', 'red text arc',
  'have you tried turning it off and on', 'the stack trace is longer than the code', 'ok but why',
])
const SWEET = new Set([
  'love the setup', 'certified banger', 'actual wizard', 'peak content', 'smoothest stream', 'cozy stream',
  'calm stream today', 'that was smooth', 'its giving senior dev', 'okay that was impressive', 'he did it',
  'let him cook', 'trust the process', 'he cooking', 'cooking', 'you got this', 'happens to the best of us',
  'easy fix probably',
])
const forTone = (lines: readonly string[], tone: Tone) =>
  tone === 'any' ? lines : lines.filter(l => !(tone === 'nice' ? SPICY : SWEET).has(l))

// Handles: prefix + suffix, sometimes with digits. 70 x 40 shapes before numbers.
const NAME_A = [
  'pixel', 'byte', 'null', 'async', 'tabs', 'vim', 'cozy', 'lofi', 'kernel', 'sudo', 'segfault', 'lambda',
  'cache', 'stack', 'heap', 'rusty', 'go', 'py', 'node', 'docker', 'git', 'merge', 'deploy', 'debug', 'regex',
  'syntax', 'binary', 'quantum', 'neon', 'retro', 'sleepy', 'grumpy', 'happy', 'spicy', 'salty', 'chill',
  'dark', 'night', 'coffee', 'tea', 'ramen', 'taco', 'potato', 'cat', 'dog', 'frog', 'duck', 'owl', 'fox',
  'panda', 'goblin', 'wizard', 'ninja', 'pirate', 'captain', 'lil', 'big', 'not', 'just', 'its', 'the',
  'real', 'xX', 'mr', 'ms', 'sir', 'dr', 'tiny', 'mega', 'ultra',
]
const NAME_B = [
  'dev', 'coder', 'hacker', 'gamer', 'enjoyer', 'andy', 'lord', 'king', 'queen', 'master', 'goblin',
  'wizard', 'bandit', 'pilot', 'monk', 'witch', 'gremlin', 'nerd', 'potato', 'cat', 'frog', 'fan',
  'lurker', 'main', 'boi', 'gal', 'dude', 'bot', 'fiend', 'head', 'brain', 'hands', 'mode', 'zone',
  'tv', 'jr', 'sr', 'xd', 'irl', 'og',
]

export function cannedName(rand: Rand = Math.random) {
  const sep = pick(['_', '', '_', ''], rand)
  const tail = rand() < 0.45 ? String(Math.floor(rand() * (rand() < 0.5 ? 100 : 10000))) : ''
  return `${pick(NAME_A, rand)}${sep}${pick(NAME_B, rand)}${tail}`
}

// The file a tool event is about, e.g. "register.tsx" from "Agent runs Edit: hooks/register.tsx".
// Only path-looking tokens count, so prose, shell flags and redirects never become a subject.
export function subject(a: Activity | undefined) {
  if (!a || (a.kind !== 'tool' && a.kind !== 'error')) return undefined
  const target = a.text.split(': ').slice(1).join(': ')
  const path = target.split(/\s+/).filter(t => /^[\w@.:\\/-]+$/.test(t) && /[./\\]/.test(t) && !t.startsWith('-')).at(-1)
  const file = path?.split(/[\\/]/).filter(Boolean).at(-1)
  return file && /\w\.\w/.test(file) ? file.slice(0, 40) : undefined
}

// Lines about the file the agent is touching, sorted by tone so each mode keeps its mood.
const ABOUT: Record<'nice' | 'mean', readonly ((s: string, r: Rand) => string)[]> = {
  nice: [
    s => `what is ${s}`,
    s => `oh we're in ${s} now`,
    (s, r) => `${s} is ${pick(NICE_ADJ, r)}`,
    (s, r) => `${s} ${pick(HYPE, r)}`,
    s => `${s} looking good`,
  ],
  mean: [
    (s, r) => `${s} again ${pick(LAUGH, r)}`,
    (s, r) => `not ${s} ${pick(SAD, r)}`,
    (s, r) => `${s} is ${pick(MEAN_ADJ, r)}`,
    s => `i was scared of ${s} too`,
  ],
}
const ABOUT_ANY = [...ABOUT.nice, ...ABOUT.mean]

export function cannedLine(mode: Mode, last: Activity | undefined, rand: Rand = Math.random) {
  const tone = toneOf(mode)
  const roll = rand()
  const about = subject(last)
  if (about && roll < 0.08) return pick(tone === 'any' ? ABOUT_ANY : ABOUT[tone], rand)(about, rand)
  const react = last && REACT[last.kind]
  if (react && roll < 0.2) return pick(forTone(react, tone), rand)
  // Mode lines get a fixed share whatever just happened, so the mode always shows.
  const flavour = rand()
  if (flavour < 0.2) return pick(BY_MODE[mode], rand)
  if (flavour < 0.26) return pick(forTone(COMMON, tone), rand)
  return fill(pickTemplate(mode, rand), rand)
}

// Lines and names shown lately, so the same thing does not come back a minute later.
const recentLines: string[] = []
const recentNames: string[] = []

function fresh(make: () => string, recent: string[], keep: number) {
  let s = make()
  for (let i = 0; i < 6 && recent.includes(s); i++) s = make()
  recent.push(s)
  if (recent.length > keep) recent.shift()
  return s
}

export function cannedChat(mode: Mode, count: number, last: Activity | undefined, rand: Rand = Math.random) {
  const out: { kind: 'chat' | 'notice'; user: string; text: string }[] = []
  for (let i = 0; i < count; i++) {
    out.push({
      kind: 'chat',
      user: fresh(() => cannedName(rand), recentNames, 30),
      text: fresh(() => cannedLine(mode, last, rand), recentLines, 80),
    })
  }
  if (rand() < 0.04) {
    out.push({ kind: 'notice', user: cannedName(rand), text: `subscribed for ${1 + Math.floor(rand() * 24)} months!` })
  }
  return out
}

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
const HYPE = ['Pog', 'PogChamp', 'POGGERS', 'LETS GOOO', 'W', 'HUGE', 'clean', 'insane', 'GG', 'sheesh']
const SAD = ['PepeHands', 'BibleThump', 'NotLikeThis', 'F', 'oof', 'pain', 'rip', 'monkaS', 'Sadge']
// Most real messages end with nothing, so the empty ending is listed several times on purpose.
const TAIL = ['', '', '', '', '', '', '', '', '', ...EMOTES, ...LAUGH, ...HYPE, ...SAD, '!!', '??', 'lol', 'fr', 'ngl', 'tbh']
const GREET = ['hi', 'hello', 'yo', 'hey', 'sup', 'hiii', 'heyo', 'good morning', 'gm', 'evening', 'howdy', 'hola', 'oi', 'wassup', 'heya']
const WHO = [
  'chat', 'everyone', 'streamer', 'gamers', 'nerds', 'friends', 'bestie', 'fam', 'lurkers', 'mods',
  'devs', 'coders', 'night owls', 'regulars', 'new people', 'besties', 'legends', 'gremlins', 'goblins', 'team',
]
const LANGS = [
  'rust', 'go', 'python', 'typescript', 'java', 'c++', 'zig', 'haskell', 'php', 'lua', 'elixir', 'kotlin',
  'c#', 'ruby', 'swift', 'scala', 'ocaml', 'clojure', 'dart', 'bash',
]
const THINGS = [
  'the tests', 'the build', 'that regex', 'the types', 'the linter', 'prod', 'the database', 'the cache',
  'the CI', 'the docs', 'that function', 'the config', 'the API', 'the merge', 'the migration', 'the readme',
  'that loop', 'the error handling', 'the variable names', 'the commit message', 'that if statement', 'the indentation',
  'the PR', 'the stack trace', 'the logs', 'the deps', 'node_modules', 'the lockfile', 'the env vars', 'the dockerfile',
  'the schema', 'the query', 'the retry logic', 'that one comment', 'the TODO list', 'the git history',
  'the folder structure', 'the naming', 'that hotfix', 'the pipeline',
]
const OPEN = [
  'ok but', 'ngl', 'honestly', 'lowkey', 'highkey', 'not gonna lie', 'bro', 'chat', 'wait', 'yo',
  'hold on', 'real talk', 'actually', 'fr', 'tbh', 'imagine if', 'no way', 'bruh', 'dude', 'hmm',
]
const PRED = [
  'is cooking', 'looks cursed', 'is goated', 'is held together by tape', 'is a crime', 'is beautiful',
  'makes no sense', 'is lowkey genius', 'needs a rewrite', 'will break in prod', 'is giving 2009', 'is suspicious',
  'passed somehow', 'is peak engineering', 'scares me', 'is actually clean', 'is pure chaos', 'deserves a raise',
  'needs therapy', 'is why prod is down', 'is art', 'is spaghetti', 'is immaculate', 'hurts my eyes', 'sparks joy',
  'is a vibe', 'is legacy already', 'is 90% vibes', 'is fine trust', 'just works somehow',
]
const ADJ = [
  'cursed', 'clean', 'sus', 'beautiful', 'scary', 'spicy', 'mid', 'goated', 'ancient', 'chaotic',
  'elegant', 'questionable', 'blessed', 'illegal', 'unhinged', 'cozy', 'crunchy', 'feral', 'pristine', 'wild',
]
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
const QSTART = ['why is', 'what is', 'who wrote', 'how does', 'wait why is', 'who approved', 'when did we change', 'is anyone else scared of']
const QEND = ['?', '??', '? genuinely asking', '? asking for a friend', 'lol', '?!']
const CMP = ['>', 'is better than', 'is just worse', 'could never beat', 'who still uses', 'vs']
const BRB = ['brb getting', 'back with', 'just grabbed', 'ok making', 'having', 'got']
const WATCH = ['watching', 'lurking', 'here', 'vibing', 'learning', 'procrastinating']

type Part = string | readonly string[]

// Each template is a row of fixed text and word lists; one line picks one word from every list.
const TEMPLATES: readonly (readonly Part[])[] = [
  [OPEN, THINGS, PRED, TAIL],
  [THINGS, PRED, TAIL],
  [THINGS, 'looking', ADJ, TAIL],
  [GREET, WHO, TAIL],
  [CHECKIN, PLACES, TAIL],
  [LANGS, CMP, LANGS, TAIL],
  ['just rewrite it in', LANGS, TAIL],
  ['this would be 3 lines in', LANGS, TAIL],
  [BRB, SNACK, TAIL],
  ['been', WATCH, 'for', TIMES, TAIL],
  [QSTART, THINGS, QEND],
  ['who touched', THINGS, TAIL],
  [ADJ, 'stream today', TAIL],
  ['the vibes are', ADJ, TAIL],
  [EMOTES, EMOTES, EMOTES],
  [LAUGH, LAUGH, TAIL],
  [HYPE, HYPE, HYPE],
]

const parts = (t: readonly Part[]) => t.filter((p): p is readonly string[] => typeof p !== 'string')

const sizeOf = (t: readonly Part[]) => parts(t).reduce((m, words) => m * new Set(words).size, 1)

// Distinct template lines possible: the sum over templates of their lists' sizes multiplied.
export const templateCount = TEMPLATES.reduce((n, t) => n + sizeOf(t), 0)

// Big templates are picked more often than small ones (by the square root of their size),
// so a three-emote line does not come up as often as a full sentence.
const WEIGHTS = TEMPLATES.map(t => Math.sqrt(sizeOf(t)))
const TOTAL_WEIGHT = WEIGHTS.reduce((a, b) => a + b, 0)

function pickTemplate(rand: Rand) {
  let left = rand() * TOTAL_WEIGHT
  for (let i = 0; i < TEMPLATES.length; i++) {
    left -= WEIGHTS[i]!
    if (left < 0) return TEMPLATES[i]!
  }
  return TEMPLATES[TEMPLATES.length - 1]!
}

const fill = (t: readonly Part[], r: Rand) =>
  t.map(p => (typeof p === 'string' ? p : pick(p, r))).filter(Boolean).join(' ').replace(/ (\?|!|,)/g, '$1')

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
  ],
  done: [
    'GG', 'GGs', 'did it work??', 'ship it', 'o7', 'W', 'merge it', 'deploy on friday', 'clean', 'next',
    'what now', 'that was fast', 'ez', 'he did it', 'okay that was impressive',
  ],
  reply: ['hi!', 'he reads chat Pog', 'streamer noticed me', 'LUL', 'true', 'real', 'facts', 'agreed', 'no way'],
  said: ['the AI said it like its easy', 'trust the AI', 'chat GPT who', 'AI explained it better than my prof', 'big words'],
  prompt: ['new task Pog', 'oh this should be fun', 'here we go again', 'good luck', 'that sounds hard', 'easy'],
  raid: ['RAID', 'welcome raiders', 'hi raiders <3', 'RAID HYPE', 'welcome in', 'raiders say hi'],
}

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

const ABOUT: ((s: string, r: Rand) => string)[] = [
  (s, r) => `${s} again ${pick(LAUGH, r)}`,
  (s, r) => `not ${s} ${pick(SAD, r)}`,
  s => `what is ${s}`,
  (s, r) => `${s} is ${pick(ADJ, r)}`,
  (s, r) => `${s} ${pick(EMOTES, r)}`,
  s => `oh we're in ${s} now`,
  s => `i was scared of ${s} too`,
]

export function cannedLine(mode: Mode, last: Activity | undefined, rand: Rand = Math.random) {
  const roll = rand()
  const about = subject(last)
  if (about && roll < 0.08) return pick(ABOUT, rand)(about, rand)
  const react = last && REACT[last.kind]
  if (react && roll < 0.15) return pick(react, rand)
  if (roll < 0.2) return pick(BY_MODE[mode], rand)
  if (roll < 0.24) return pick(COMMON, rand)
  return fill(pickTemplate(rand), rand)
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

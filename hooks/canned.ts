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
const GREET = ['hi', 'hello', 'yo', 'hey', 'sup', 'hiii', 'heyo', 'good morning', 'gm', 'evening']
const WHO = ['chat', 'everyone', 'streamer', 'gamers', 'nerds', 'friends', 'bestie', 'fam', 'lurkers', 'mods']
const LANGS = ['rust', 'go', 'python', 'typescript', 'java', 'c++', 'zig', 'haskell', 'php', 'lua', 'elixir', 'kotlin']
const THINGS = [
  'the tests', 'the build', 'that regex', 'the types', 'the linter', 'prod', 'the database', 'the cache',
  'the CI', 'the docs', 'that function', 'the config', 'the API', 'the merge', 'the migration', 'the readme',
]
const ADJ = [
  'cursed', 'clean', 'sus', 'beautiful', 'scary', 'spicy', 'mid', 'goated', 'ancient', 'chaotic',
  'elegant', 'questionable', 'blessed', 'illegal', 'unhinged', 'cozy',
]
const SNACK = ['ramen', 'coffee', 'tea', 'pizza', 'cereal', 'energy drink', 'toast', 'leftovers', 'dumplings', 'a sandwich']
const TIMES = ['5 min', '2 hours', 'since the start', 'all week', 'since 2019', 'forever', 'a decade', '10 seconds']

const TEMPLATES: ((r: Rand) => string)[] = [
  r => `${pick(GREET, r)} ${pick(WHO, r)}`,
  r => `${pick(GREET, r)} ${pick(WHO, r)} ${pick(EMOTES, r)}`,
  r => `${pick(LAUGH, r)} ${pick(LAUGH, r)}`,
  r => `${pick(HYPE, r)} ${pick(HYPE, r)} ${pick(HYPE, r)}`,
  r => Array.from({ length: 2 + Math.floor(r() * 4) }, () => pick(EMOTES, r)).join(' '),
  r => `${pick(THINGS, r)} looking ${pick(ADJ, r)}`,
  r => `${pick(THINGS, r)} is ${pick(ADJ, r)} ngl`,
  r => `just rewrite it in ${pick(LANGS, r)}`,
  r => `this would be 3 lines in ${pick(LANGS, r)}`,
  r => `is this ${pick(LANGS, r)}?`,
  r => `${pick(LANGS, r)} gang where you at`,
  r => `${pick(LANGS, r)} > ${pick(LANGS, r)} fight me`,
  r => `eating ${pick(SNACK, r)} watching this`,
  r => `brb getting ${pick(SNACK, r)}`,
  r => `back, did I miss ${pick(THINGS, r)}?`,
  r => `been watching for ${pick(TIMES, r)} ${pick(EMOTES, r)}`,
  r => `lurking for ${pick(TIMES, r)} first time chatting`,
  r => `${pick(THINGS, r)} gonna break ${pick(SAD, r)}`,
  r => `who touched ${pick(THINGS, r)} ${pick(LAUGH, r)}`,
  r => `${pick(THINGS, r)}?? ${pick(EMOTES, r)}`,
  r => `trust me ${pick(THINGS, r)} is fine Clueless`,
  r => `${pick(ADJ, r)} stream today ${pick(EMOTES, r)}`,
  r => `the vibes are ${pick(ADJ, r)}`,
  r => `${pick(SAD, r)} my ${pick(THINGS, r).replace(/^the |^that /, '')} at work looks like this`,
]

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
  if (about && roll < 0.15) return pick(ABOUT, rand)(about, rand)
  const react = last && REACT[last.kind]
  if (react && roll < 0.35) return pick(react, rand)
  if (roll < 0.55) return pick(BY_MODE[mode], rand)
  if (roll < 0.75) return pick(COMMON, rand)
  return pick(TEMPLATES, rand)(rand)
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

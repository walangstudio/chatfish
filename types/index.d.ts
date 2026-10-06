export type Mode = 'hype' | 'roast' | 'mixed' | 'curious' | 'wholesome' | 'chaos'
export type Rate = 'quiet' | 'normal' | 'frequent'
export type Badge = 'broadcaster' | 'mod' | 'vip' | 'sub' | 'prime'
// streamer: the nickname chat uses; '' means the Claude display name, then the email's local part.
export type Config = { live: boolean; mode: Mode; viewers: number; rate: Rate; startedAt: number; streamer: string }
export type ChatLine = {
  id: number
  kind: 'chat' | 'streamer' | 'notice' | 'system'
  user: string
  text: string
}
export type Activity = { seq: number; at: number; kind: 'prompt' | 'tool' | 'error' | 'done' | 'reply' | 'said' | 'raid'; text: string }

declare module 'claude-code' {
  interface PluginState {
    chatfish: { config: Config; lines: ChatLine[]; activity: Activity[]; viewers: number; isSettingsLoaded: boolean; draft: string }
  }
}

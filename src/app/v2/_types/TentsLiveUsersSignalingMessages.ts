export type TentsLiveUsersSignalingMessages =
  | { type: "current_tent_users"; tents: { [tentId: string]: string[] } }
  | { type: "user_joined"; tent_id: string; username: string }
  | { type: "user_left"; tent_id: string; username: string }
  | { type: "ping"; ts: number }
  | { type: "pong"; ts: number };

import { GAME_CONFIG } from "../../data/gameConfig.js";

export function getCurrentHeight(state, viewportHeight) {
  return Math.max(0, Math.floor((viewportHeight - state.player.com.y) / GAME_CONFIG.heightScale));
}

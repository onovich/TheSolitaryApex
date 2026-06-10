import { resetDynoState } from "./dynoStateSystem.js";
import { beginFall } from "./fallRecoverySystem.js";
import { setGameOver } from "./gameOverSystem.js";
import { isInvincibleEnabled, stabilizeInvincibleState } from "./invincibleFailureSystem.js";
import { createInitialFallState } from "./recoveryStateSystem.js";

export { isInvincibleEnabled, setInvincibleDebug, stabilizeInvincibleState } from "./invincibleFailureSystem.js";
export { setGameOver } from "./gameOverSystem.js";

export function resetFallAndDynoState(state) {
  state.fallState = createInitialFallState();
  resetDynoState(state.movementState.dyno);
}

export function resolveFailure(state, reason, viewportHeight, runtime) {
  if (isInvincibleEnabled(state)) {
    stabilizeInvincibleState(state, reason, viewportHeight, runtime);
    return;
  }

  beginFall(state, reason, viewportHeight, runtime.getFallRecoveryRuntime());
}

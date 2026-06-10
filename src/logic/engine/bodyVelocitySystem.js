const BODY_VELOCITY_DAMPING = 0.84;
const BODY_VELOCITY_DEADZONE = 0.01;

function dampVelocityComponent(value) {
  const dampedValue = value * BODY_VELOCITY_DAMPING;

  return Math.abs(dampedValue) < BODY_VELOCITY_DEADZONE ? 0 : dampedValue;
}

export function applyBodyVelocity(state) {
  state.player.com.x += state.movementState.bodyVelocity.x;
  state.player.com.y += state.movementState.bodyVelocity.y;
  state.movementState.bodyVelocity.x = dampVelocityComponent(state.movementState.bodyVelocity.x);
  state.movementState.bodyVelocity.y = dampVelocityComponent(state.movementState.bodyVelocity.y);
}

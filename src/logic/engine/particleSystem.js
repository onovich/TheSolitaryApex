export function pushParticles(state, x, y, count, color) {
  for (let index = 0; index < count; index += 1) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2,
      life: 1,
      color,
    });
  }
}

export function updateParticles(state) {
  for (let index = state.particles.length - 1; index >= 0; index -= 1) {
    const particle = state.particles[index];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.1;
    particle.life -= 0.05;

    if (particle.life <= 0) {
      state.particles.splice(index, 1);
    }
  }
}

export function createFailureRuntime(getFallRecoveryRuntime, runtime) {
  return {
    getFallRecoveryRuntime,
    getLimbReachRuntime: runtime.getLimbReachRuntime,
  };
}

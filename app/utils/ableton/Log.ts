// Simplified logger
export const Log = {
  Debug: (...args: any[]) => console.debug("[Ableton]", ...args),
  Information: (...args: any[]) => console.info("[Ableton]", ...args),
  Error: (...args: any[]) => console.error("[Ableton]", ...args),
  Warning: (...args: any[]) => console.warn("[Ableton]", ...args),
};

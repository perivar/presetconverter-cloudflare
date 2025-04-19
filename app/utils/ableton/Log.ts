// Simplified logger
export const Log = {
  Debug: (...args: any[]) => console.debug("[AbletonMidi]", ...args),
  Information: (...args: any[]) => console.info("[AbletonMidi]", ...args),
  Error: (...args: any[]) => console.error("[AbletonMidi]", ...args),
  Warning: (...args: any[]) => console.warn("[AbletonMidi]", ...args),
};

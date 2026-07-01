// `||` not `??` — an unset VITE_API_URL build arg inlines as "" and must still fall back
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

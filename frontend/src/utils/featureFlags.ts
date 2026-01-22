// Lightweight feature flags for the UI
// Default OFF to preserve current behavior. Override via query param or localStorage.
// Usage: isFlagEnabled('voice_pipeline_v1')

type FlagKey = 'voice_pipeline_v1';

const DEFAULT_FLAGS: Record<FlagKey, boolean> = {
  voice_pipeline_v1: false,
};

function flagStorageKey(k: FlagKey) { return `ff_${k}`; }

export function isFlagEnabled(key: FlagKey): boolean {
  // 1) URL override ?ff_voice_pipeline_v1=1
  try {
    const params = new URLSearchParams(window.location.search);
    const qp = params.get(flagStorageKey(key));
    if (qp === '1' || qp === 'true') return true;
    if (qp === '0' || qp === 'false') return false;
  } catch {}

  // 2) Local storage
  try {
    const v = localStorage.getItem(flagStorageKey(key));
    if (v === '1' || v === 'true') return true;
    if (v === '0' || v === 'false') return false;
  } catch {}

  // 3) Default
  return DEFAULT_FLAGS[key];
}

export function setFlag(key: FlagKey, enabled: boolean) {
  try { localStorage.setItem(flagStorageKey(key), enabled ? '1' : '0'); } catch {}
}

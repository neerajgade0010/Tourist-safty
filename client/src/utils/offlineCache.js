const CACHE_KEYS = {
  EMERGENCY: 'offline_emergency',
  RISK_ZONES: 'offline_risk_zones',
  SAFETY_TIPS: 'offline_safety_tips',
  LAST_COORDS: 'offline_last_coords',
  CACHE_TS: 'offline_cache_ts',
};

export const saveCache = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
  localStorage.setItem(CACHE_KEYS.CACHE_TS, new Date().toISOString());
};

export const loadCache = (key) => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
};

export const getCacheTimestamp = () => localStorage.getItem(CACHE_KEYS.CACHE_TS);
export { CACHE_KEYS };

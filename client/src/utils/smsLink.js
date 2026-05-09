export const buildSmsLink = (emergencyNumber, lat, lng) => {
  const coords = (lat != null && lng != null) ? ` My location: ${lat.toFixed(5)},${lng.toFixed(5)}` : '';
  const body = `🆘 SOS! I need help.${coords}`;
  return `sms:${emergencyNumber}?body=${encodeURIComponent(body)}`;
};

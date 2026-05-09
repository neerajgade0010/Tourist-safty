import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { saveCache, loadCache, getCacheTimestamp, CACHE_KEYS } from '../utils/offlineCache';
import { buildSmsLink } from '../utils/smsLink';
import { buildWhatsAppLink } from '../utils/whatsappLink';
import { getContacts } from '../services/contactService';

const EMERGENCY_NUMBERS = [
  { label: 'Police', number: '100' },
  { label: 'Ambulance', number: '108' },
  { label: 'Fire', number: '101' },
  { label: 'Women Helpline', number: '1091' },
  { label: 'Tourist Helpline', number: '1800-111-363' },
];

const RISK_ZONE_SUMMARY = [
  { zone: 'North Delhi', info: 'High density area with elevated pickpocketing and traffic risks near Chandni Chowk and Old Delhi markets.' },
  { zone: 'Noida', info: 'Moderate risk in isolated sectors after dark; exercise caution near construction zones and less-lit areas.' },
  { zone: 'Gurugram', info: 'Road safety concerns on highways; be alert in crowded malls and late-night travel.' },
];

const SAFETY_TIPS = [
  '📱 Keep your phone charged and share your live location with a trusted contact.',
  '🚫 Avoid displaying expensive jewellery or electronics in crowded areas.',
  '🗺️ Download offline maps before travelling to areas with poor connectivity.',
  '🚕 Use only registered taxis or verified ride-sharing apps.',
  '💧 Carry sufficient water and stay hydrated, especially in summer months.',
  '📋 Keep a physical copy of important documents (passport, ID) separate from originals.',
  '🏨 Inform your hotel/host of your daily itinerary.',
  '🆘 Save local emergency numbers in your phone before you travel.',
];

// Detect if running on a mobile device
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const OfflineSafety = () => {
  const [toast, setToast] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(getCacheTimestamp());
  const [cachedEmergency, setCachedEmergency] = useState(loadCache(CACHE_KEYS.EMERGENCY));
  const [cachedRiskZones, setCachedRiskZones] = useState(loadCache(CACHE_KEYS.RISK_ZONES));
  const [cachedTips, setCachedTips] = useState(loadCache(CACHE_KEYS.SAFETY_TIPS));
  const [sosModal, setSosModal] = useState(null); // { message, coords, contacts }
  const [myContacts, setMyContacts] = useState([]);
  const isOnline = navigator.onLine;

  // Fetch emergency contacts on mount (if online)
  useEffect(() => {
    if (isOnline) {
      getContacts()
        .then((res) => setMyContacts(res.data || []))
        .catch(() => {});
    }
  }, []);

  const persistCache = () => {
    saveCache(CACHE_KEYS.EMERGENCY, EMERGENCY_NUMBERS);
    saveCache(CACHE_KEYS.RISK_ZONES, RISK_ZONE_SUMMARY);
    saveCache(CACHE_KEYS.SAFETY_TIPS, SAFETY_TIPS);
    setCachedEmergency(EMERGENCY_NUMBERS);
    setCachedRiskZones(RISK_ZONE_SUMMARY);
    setCachedTips(SAFETY_TIPS);
    setLastRefreshed(getCacheTimestamp());
  };

  useEffect(() => {
    if (isOnline) persistCache();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const triggerSOS = (lat, lng) => {
    const coords = (lat != null && lng != null)
      ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      : null;
    const message = `🆘 SOS! I need help.${coords ? ` My location: ${coords}` : ''}`;

    if (isMobile()) {
      // On mobile: open native SMS app directly
      const link = buildSmsLink('112', lat, lng);
      window.location.href = link;
    } else {
      // On desktop: show modal with message + call options + emergency contacts
      setSosModal({ message, coords, lat, lng });
    }
  };

  const handleSOS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          saveCache(CACHE_KEYS.LAST_COORDS, { lat: latitude, lng: longitude });
          triggerSOS(latitude, longitude);
        },
        () => {
          const cached = loadCache(CACHE_KEYS.LAST_COORDS);
          if (cached) {
            triggerSOS(cached.lat, cached.lng);
          } else {
            showToast('⚠️ Could not get location. Sending SOS without coordinates.');
            triggerSOS(null, null);
          }
        }
      );
    } else {
      const cached = loadCache(CACHE_KEYS.LAST_COORDS);
      triggerSOS(cached?.lat ?? null, cached?.lng ?? null);
    }
  };

  const hasCache = cachedEmergency || cachedRiskZones || cachedTips;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-semibold">
          {toast}
        </div>
      )}

      {/* SOS Modal (desktop) */}
      {sosModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🆘</span>
              <h2 className="text-xl font-bold text-red-400">SOS Alert Ready</h2>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              On mobile, this opens your SMS app. On desktop, use the options below:
            </p>

            {/* Message preview */}
            <div className="bg-gray-800 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500 mb-1">SOS message:</p>
              <p className="text-white text-sm font-medium">{sosModal.message}</p>
              {sosModal.coords && (
                <p className="text-green-400 text-xs mt-2">📍 Location: {sosModal.coords}</p>
              )}
            </div>

            {/* Emergency contacts section */}
            {myContacts.length > 0 && (
              <div className="mb-5">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                  Your Emergency Contacts
                </p>
                <div className="space-y-2">
                  {myContacts.map((c) => (
                    <div key={c._id} className="bg-gray-800 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-white text-sm font-semibold">{c.name}</p>
                        {c.phone && <p className="text-gray-400 text-xs">{c.phone}</p>}
                        {c.email && <p className="text-gray-500 text-xs">{c.email}</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {c.phone && (
                          <a
                            href={`tel:${c.phone}`}
                            className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg transition"
                          >
                            📞 Call
                          </a>
                        )}
                        {c.phone && (
                          <a
                            href={buildWhatsAppLink(c.phone, `${window.location.origin}/track/${encodeURIComponent(localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')).email : '')}`, c.name)}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#25D366] hover:bg-green-400 text-white text-xs px-3 py-1.5 rounded-lg transition"
                          >
                            💬 WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {myContacts.length === 0 && (
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mb-5 text-xs text-yellow-400">
                💡 No emergency contacts saved. Add them in Emergency Contacts page for quick access here.
              </div>
            )}

            {/* Official emergency numbers */}
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Official Emergency</p>
            <div className="space-y-2">
              <a
                href="tel:112"
                className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition"
              >
                📞 Call 112 — Universal Emergency
              </a>
              <div className="grid grid-cols-2 gap-2">
                <a href="tel:100" className="flex items-center justify-center gap-1 bg-blue-600/80 hover:bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium transition">
                  🚓 Police 100
                </a>
                <a href="tel:108" className="flex items-center justify-center gap-1 bg-green-600/80 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium transition">
                  🚑 Ambulance 108
                </a>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(sosModal.message);
                  showToast('✅ SOS message copied to clipboard!');
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl font-medium transition text-sm"
              >
                📋 Copy SOS Message
              </button>
            </div>

            <button
              onClick={() => setSosModal(null)}
              className="mt-4 w-full text-gray-500 hover:text-white text-sm transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">📶 Offline Safety</h1>
            {lastRefreshed && (
              <p className="text-gray-400 text-xs mt-1">
                Last refreshed: {new Date(lastRefreshed).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            {isOnline && (
              <button
                onClick={persistCache}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                🔄 Refresh Cache
              </button>
            )}
            <button
              onClick={handleSOS}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition shadow-lg shadow-red-900/40"
            >
              🆘 SOS — Emergency
            </button>
          </div>
        </div>

        {!hasCache && !isOnline && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center text-gray-400">
            No cached data available. Connect to the internet to load safety information.
          </div>
        )}

        {/* Emergency Numbers */}
        {cachedEmergency && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-4 text-red-400">🚨 Emergency Numbers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cachedEmergency.map((item) => (
                <a
                  key={item.label}
                  href={`tel:${item.number}`}
                  className="bg-gray-800 hover:bg-gray-700 rounded-xl p-3 text-center transition cursor-pointer"
                >
                  <p className="text-gray-400 text-xs">{item.label}</p>
                  <p className="text-white font-bold text-lg">{item.number}</p>
                  <p className="text-blue-400 text-xs mt-1">Tap to call</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Risk Zones */}
        {cachedRiskZones && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-4 text-yellow-400">⚠️ Risk Zone Summary</h2>
            <div className="space-y-3">
              {cachedRiskZones.map((zone) => (
                <div key={zone.zone} className="bg-gray-800 rounded-xl p-4">
                  <p className="font-semibold text-white">{zone.zone}</p>
                  <p className="text-gray-400 text-sm mt-1">{zone.info}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Tips */}
        {cachedTips && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-4 text-green-400">✅ Safety Tips</h2>
            <ul className="space-y-2">
              {cachedTips.map((tip, i) => (
                <li key={i} className="bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineSafety;

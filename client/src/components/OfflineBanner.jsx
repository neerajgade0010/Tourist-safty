import { useState, useEffect } from 'react';

const OfflineBanner = ({ onOnline }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      if (onOnline) onOnline();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [onOnline]);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center py-2 px-4 font-semibold text-sm shadow-md">
      📶 You are offline. Some features may be unavailable.
    </div>
  );
};

export default OfflineBanner;

import { useEffect } from "react";
import { updateLocation } from "../services/locationService";

const useLiveLocation = (userId, isSharing) => {
  useEffect(() => {
    if (!isSharing || !userId) return;

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          await updateLocation(userId, latitude, longitude);
        } catch (err) {
          console.error("Location update failed:", err.message);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [userId, isSharing]);
};

export default useLiveLocation;

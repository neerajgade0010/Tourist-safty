import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { getUserLocation } from "../services/locationService";

const TrackUser = () => {
  const { userId } = useParams();
  const [location, setLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await getUserLocation(userId);
        setLocation(res.data);
        setLastUpdated(new Date().toLocaleTimeString());
        setIsActive(res.data.isSharing);
        setError(null);
      } catch (err) {
        setError("Could not fetch location");
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-xl text-red-500">
        {error}
      </div>
    );
  }

  if (!location) {
    return (
      <div className="h-screen flex items-center justify-center text-xl text-gray-600">
        Loading live location...
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/70 text-white px-4 py-2 rounded-xl text-center">
        📍 Tracking: {decodeURIComponent(userId).split("@")[0]}
        <br />
        {isActive ? (
          <span className="text-green-400">🟢 Live</span>
        ) : (
          <span className="text-red-400">🔴 Sharing Stopped</span>
        )}
        <br />
        <span className="text-xs text-gray-300">⏱ Updated: {lastUpdated}</span>
      </div>

      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={{ lat: location.lat, lng: location.lng }}
        zoom={16}
      >
        <Marker position={{ lat: location.lat, lng: location.lng }} />
      </GoogleMap>
    </div>
  );
};

export default TrackUser;

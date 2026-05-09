import {
  GoogleMap,
  Marker,
  DirectionsService,
  DirectionsRenderer,
  Circle,
  InfoWindow
} from "@react-google-maps/api";
import useAllLocations from "../hooks/useAllLocations";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getPlaceInfo } from "../utils/getPlaceInfo";
import { createAlert } from "../services/alertService";

// Deterministic safety score from placeId — always returns same value for same input
const safetyScore = (placeId) => {
  let hash = 0;
  for (let i = 0; i < placeId.length; i++) {
    hash = (hash * 31 + placeId.charCodeAt(i)) & 0xffffffff;
  }
  return 60 + (Math.abs(hash) % 40);
};
const containerStyle = {
  width: "100%",
  height: "100%"
};

// Risk zone definitions — center + radius in meters
const RISK_ZONES = [
  {
    lat: 28.7041,
    lng: 77.1025,
    label: "North Delhi",
    reason: "High crime rate area",
    details: "Frequent incidents of theft, snatching, and street crime reported. Exercise caution especially after dark.",
    level: "High",
  },
  {
    lat: 28.5355,
    lng: 77.3910,
    label: "Noida",
    reason: "Traffic & safety concerns",
    details: "Known for road accidents and isolated areas. Avoid travelling alone at night in industrial zones.",
    level: "Medium",
  },
  {
    lat: 28.4595,
    lng: 77.0266,
    label: "Gurugram",
    reason: "Reported criminal activity",
    details: "Incidents of vehicle theft and mugging reported in certain sectors. Stay in well-lit public areas.",
    level: "Medium",
  },
];

const RISK_CIRCLE_OPTIONS = {
  strokeColor: "#FF0000",
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#FF0000",
  fillOpacity: 0.25,
  radius: 3000, // meters
};

const MapView = ({
  destination,
  showHospitals,
  showPolice,
  showRisk,
  onPlaceDetails,
  onEmergency,
  showOtherUsers = false,
}) => {
  const [directions, setDirections] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [mapRef, setMapRef] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [hoveredZone, setHoveredZone] = useState(null);

  const allUsers = useAllLocations().locations ?? [];

  // 🔥 NEW (FIX)
  const [emergencyTarget, setEmergencyTarget] = useState(null);

  // 📍 USER LOCATION
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      () => {
        setCurrentLocation({
          lat: 28.6139,
          lng: 77.2090
        });
      }
    );
  }, []);

  // 🔄 RESET ROUTE
  useEffect(() => {
    setDirections(null);
    setDistance("");
    setDuration("");
    setEmergencyTarget(null); // 🔥 reset emergency also
  }, [destination]);

  // 🔥 DISTANCE FUNCTION
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 🔥 SORT TOP 3
  const sortByDistance = (places) => {
    const base = destination || currentLocation;

    return places
      .map((place) => {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        const distance = calculateDistance(
          base.lat,
          base.lng,
          lat,
          lng
        );

        return { ...place, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  };

  // 🏥 + 🚓 NEARBY
  useEffect(() => {
    if (!window.google || !currentLocation) return;

    const service = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );

    const fetchPlaces = (type) => {
      return new Promise((resolve) => {
        service.nearbySearch(
          {
            location: destination || currentLocation,
            radius: 5000,
            type
          },
          (results) => resolve(results || [])
        );
      });
    };

    const getAllPlaces = async () => {
      let all = [];

      if (showHospitals) {
        const h = await fetchPlaces("hospital");
        all = [...all, ...sortByDistance(h)];
      }

      if (showPolice) {
        const p = await fetchPlaces("police");
        all = [...all, ...sortByDistance(p)];
      }

      setNearby(all);
    };

    if (!showHospitals && !showPolice) {
      setNearby([]);
      return;
    }

    getAllPlaces();
  }, [showHospitals, showPolice, destination, currentLocation]);

  // 🧠 PLACE DETAILS
  useEffect(() => {
    if (!destination || !window.google || !destination.placeId) return;

    const service = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );

    service.getDetails(
      {
        placeId: destination.placeId,
        fields: ["name", "formatted_address", "rating", "photos"]
      },
      async (place, status) => {
        if (status === "OK" && place) {
          const wiki = await getPlaceInfo(place.name);

          onPlaceDetails?.({
            name: place.name,
            address: place.formatted_address,
            rating: place.rating,
            photo:
              place.photos?.[0]?.getUrl() ||
              wiki.image ||
              "https://via.placeholder.com/400",
            description: wiki.description,
            safety: safetyScore(destination.placeId || place.place_id || place.name),
          });
        }
      }
    );
  }, [destination]);

  // 🧭 PAN
  useEffect(() => {
    if (mapRef && destination && nearby.length === 0) {
      mapRef.panTo(destination);
      mapRef.setZoom(14);
    }
  }, [destination]);

  // 🔥 AUTO FIT
  useEffect(() => {
    if (!mapRef || nearby.length === 0 || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();

    nearby.forEach((p) => {
      bounds.extend({
        lat: p.geometry.location.lat(),
        lng: p.geometry.location.lng()
      });
    });

    if (destination) bounds.extend(destination);
    if (emergencyTarget) bounds.extend(emergencyTarget);

    mapRef.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 });
  }, [nearby, emergencyTarget]);

  // 🚨 AUTO ZOOM TO RISK ZONES
  useEffect(() => {
    if (!mapRef || !window.google) return;

    if (showRisk) {
      const bounds = new window.google.maps.LatLngBounds();
      RISK_ZONES.forEach((zone) => bounds.extend({ lat: zone.lat, lng: zone.lng }));
      mapRef.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 });
      // slight zoom out so circles are fully visible
      setTimeout(() => mapRef.setZoom(mapRef.getZoom() - 1), 300);
    } else {
      // reset to user location when risk zones turned off
      if (currentLocation) {
        mapRef.panTo(currentLocation);
        mapRef.setZoom(12);
      }
    }
  }, [showRisk]);

  const handleEmergency = async () => {
    if (!window.google || !currentLocation) return;

    const storedUser = JSON.parse(localStorage.getItem("userData"));
    const userId = storedUser?.email || "unknown";

    try {
      await createAlert(userId, currentLocation.lat, currentLocation.lng);
    } catch (err) {
      console.error("Alert failed:", err.message);
    }

    // Find nearest hospital and route to it
    const service = new window.google.maps.places.PlacesService(
    document.createElement("div")
  );

  service.nearbySearch(
    {
      location: destination || currentLocation,
      radius: 5000,
      type: "hospital"
    },
    (results) => {
      if (!results || results.length === 0) {
        alert("No hospital found nearby!");
        return;
      }

      const sorted = sortByDistance(results);
      const hospital = sorted[0];

      const loc = {
        lat: hospital.geometry.location.lat(),
        lng: hospital.geometry.location.lng(),
        placeId: hospital.place_id
      };

      setDirections(null);
      setEmergencyTarget(loc);
      setNearby(sorted);

      onEmergency?.(loc);
    }
  );
};

  const directionsCallback = (res) => {
    if (!res || directions) return;

    if (res.status === "OK") {
      setDirections(res);
      const leg = res.routes[0].legs[0];
      setDistance(leg.distance.text);
      setDuration(leg.duration.text);
    }
  };

  if (!currentLocation) {
    return <p className="text-white">📍 Getting your location...</p>;
  }

  const hospitalIcon = window.google && {
    url: "https://maps.google.com/mapfiles/kml/shapes/hospitals.png",
    scaledSize: new window.google.maps.Size(40, 40)
  };

  const policeIcon = window.google && {
    url: "https://maps.google.com/mapfiles/kml/shapes/police.png",
    scaledSize: new window.google.maps.Size(40, 40)
  };

  return (
    <motion.div className="relative h-full">

      {/* 🚨 BUTTON */}
      <button
        onClick={handleEmergency}
        className="absolute top-16 left-4 z-10 bg-red-600 text-white px-4 py-2 rounded-xl shadow-lg"
      >
        🚨 Emergency
      </button>

      {/* 🔥 STATUS */}
      {emergencyTarget && (
        <div className="absolute bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-xl z-10 shadow-lg">
          🚨 Routing to nearest hospital
        </div>
      )}

      {/* DISTANCE */}
      {distance && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-xl z-10">
          🚗 {distance} | ⏱ {duration}
        </div>
      )}

      <GoogleMap
        center={currentLocation}
        zoom={12}
        mapContainerStyle={containerStyle}
        onLoad={(map) => setMapRef(map)}
      >

        <Marker position={currentLocation} label="You" />

        {(destination || emergencyTarget) && (
          <>
            <Marker position={emergencyTarget || destination} label="Target" />

            {!directions && (
              <DirectionsService
                options={{
                  origin: currentLocation,
                  destination: emergencyTarget || destination,
                  travelMode: "DRIVING"
                }}
                callback={directionsCallback}
              />
            )}
          </>
        )}

        {directions && <DirectionsRenderer directions={directions} />}

        {nearby.map((place, i) => (
          <Marker
            key={i}
            position={{
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }}
            icon={
              place.types?.includes("hospital")
                ? hospitalIcon
                : policeIcon
            }
            label={{
              text: `${place.distance?.toFixed(1)} km`,
              color: "white",
              fontSize: "12px",
              fontWeight: "bold"
            }}
            onClick={() => setSelectedPlace(place)}
          />
        ))}

        {selectedPlace && (
          <InfoWindow
            position={{
              lat: selectedPlace.geometry.location.lat(),
              lng: selectedPlace.geometry.location.lng()
            }}
            onCloseClick={() => setSelectedPlace(null)}
          >
            <div style={{ color: "black" }}>
              <h3>{selectedPlace.name}</h3>
              <p>⭐ {selectedPlace.rating || "N/A"}</p>
              <p>{selectedPlace.vicinity}</p>
            </div>
          </InfoWindow>
        )}

        {/* 🔥 LIVE USERS — only shown on admin view */}
        {showOtherUsers && allUsers.map((user, index) => (
          <Marker
            key={index}
            position={{
              lat: user.lat,
              lng: user.lng
            }}
            icon={{
              url: "https://maps.google.com/mapfiles/kml/shapes/man.png",
              scaledSize: new window.google.maps.Size(35, 35)
            }}
            label={{
              text: user.userId?.split("@")[0] || "User",
              color: "black",
              fontSize: "12px"
            }}
          />
        ))}

        {showRisk && RISK_ZONES.map((zone, i) => (
          <Circle
            key={i}
            center={{ lat: zone.lat, lng: zone.lng }}
            options={{
              ...RISK_CIRCLE_OPTIONS,
              fillOpacity: hoveredZone?.label === zone.label ? 0.45 : 0.25,
            }}
            onMouseOver={() => setHoveredZone(zone)}
            onMouseOut={() => setHoveredZone(null)}
            onClick={() => setHoveredZone(zone)}
          />
        ))}

        {hoveredZone && showRisk && (
          <InfoWindow
            position={{ lat: hoveredZone.lat, lng: hoveredZone.lng }}
            onCloseClick={() => setHoveredZone(null)}
          >
            <div style={{ maxWidth: 220, fontFamily: "sans-serif" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
              }}>
                <span style={{ fontSize: 18 }}>🚨</span>
                <strong style={{ fontSize: 14, color: "#c0392b" }}>
                  {hoveredZone.label}
                </strong>
                <span style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  background: hoveredZone.level === "High" ? "#e74c3c" : "#e67e22",
                  color: "#fff",
                  padding: "2px 7px",
                  borderRadius: 10,
                }}>
                  {hoveredZone.level} Risk
                </span>
              </div>
              <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 12, color: "#333" }}>
                ⚠️ {hoveredZone.reason}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#555", lineHeight: 1.5 }}>
                {hoveredZone.details}
              </p>
            </div>
          </InfoWindow>
        )}

      </GoogleMap>
    </motion.div>
  );
};

export default MapView;
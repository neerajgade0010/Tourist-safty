import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

const PlaceSearch = ({ setDestination }) => {
  const inputRef = useRef();

  useEffect(() => {
    if (!window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        fields: ["geometry", "name", "formatted_address", "place_id", "photos", "types"]
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.geometry) return;

      // ✅ FIX: include placeId
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        placeId: place.place_id
      };

      console.log("Selected Place:", location); // 🔍 debug

      setDestination(location);
    });

  }, []);

  return (
    <motion.input
      ref={inputRef}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      placeholder="🔍 Search any tourist place..."
      className="w-full px-6 py-3 rounded-xl bg-white/20 backdrop-blur-lg border border-white/30 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-400 transition shadow-lg"
    />
  );
};

export default PlaceSearch;
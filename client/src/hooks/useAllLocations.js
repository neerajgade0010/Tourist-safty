import { useEffect, useState } from "react";
import { getAllLocations } from "../services/locationService";

const useAllLocations = () => {
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await getAllLocations();
        setLocations(res.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchLocations();
    const interval = setInterval(fetchLocations, 5000);
    return () => clearInterval(interval);
  }, []);

  return { locations, error };
};

export default useAllLocations;

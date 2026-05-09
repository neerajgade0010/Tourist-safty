import { useEffect, useState } from "react";

const images = [
  "https://images.unsplash.com/photo-1526779259212-939e64788e3c",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e"
];

const BackgroundSlider = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
      style={{ backgroundImage: `url(${images[index]})` }}
    />
  );
};

export default BackgroundSlider;
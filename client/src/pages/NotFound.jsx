import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white gap-4">
      <h1 className="text-6xl font-bold text-blue-400">404</h1>
      <p className="text-xl text-gray-300">Page not found</p>
      <p className="text-gray-500 text-sm">The page you're looking for doesn't exist.</p>
      <button
        onClick={() => navigate("/")}
        className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition"
      >
        Back to Home
      </button>
    </div>
  );
};

export default NotFound;

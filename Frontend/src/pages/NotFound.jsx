import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center px-4">
        <h1 className="mb-4 text-4xl font-bold text-gray-800">404</h1>
        <p className="mb-4 text-xl text-gray-500">
          Oops! Page not found
        </p>
        <Link
          to="/"
          className="text-blue-600 underline hover:text-blue-500 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

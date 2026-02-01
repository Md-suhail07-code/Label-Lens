import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to splash so direct URL visits and unknown routes land on the app entry
    navigate("/", { replace: true });
  }, [navigate, location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center px-4">
        <p className="text-gray-500">Redirecting…</p>
      </div>
    </div>
  );
};

export default NotFound;

import { Outlet, useLocation, Link, Navigate } from "react-router-dom";
import Footer from "@/components/common/Footer";
import { useEffect } from "react";

export default function PublicLayout() {
  const location = useLocation();
  const token = localStorage.getItem("token");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 shadow-md p-4 bg-white">
        <div className="flex justify-center items-center">
          <Link to="/login">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-12 w-auto object-contain cursor-pointer"
            />
          </Link>
        </div>
      </div>

      {/* Content */}
      <main className="flex items-center justify-center grow px-4">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

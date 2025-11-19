import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return null; 

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div
      style={{
        backgroundColor: "#fff",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar />
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;

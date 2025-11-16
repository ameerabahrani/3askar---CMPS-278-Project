import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage"; // only if this file exists
import "./App.css";

function App() {
  return (
    <Routes>
      {/* Login / Home */}
      <Route path="/" element={<LoginPage />} />

      {/* Forgot password */}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Reset password with token */}
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
    </Routes>
  );
}

export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Homepage from "./components/Homepage";
import MyDrive from "./pages/MyDrive";
import Starred from "./pages/Starred";
import Shared from "./pages/Shared";
import Bin from "./pages/Bin";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Homepage />} />
            <Route path="/mydrive" element={<MyDrive />} />
            <Route path="/starred" element={<Starred />} />
            <Route path="/shared" element={<Shared />} />
            <Route path="/bin" element={<Bin />} />
            <Route path='/folders/:folderId' element ={<Homepage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

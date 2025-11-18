import React from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Homepage from "./components/Homepage";
import LoginPage from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import MyDrive from "./pages/MyDrive";
import Starred from "./pages/Starred";
import Shared from "./pages/Shared";
import Bin from "./pages/Bin";

const DashboardLayout = () => (
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
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Outlet />
      </div>
    </div>
  </div>
);

const ProtectedLayout = () => {
  return <DashboardLayout />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/mydrive" element={<MyDrive />} />
          <Route path="/starred" element={<Starred />} />
          <Route path="/shared" element={<Shared />} />
          <Route path="/bin" element={<Bin />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

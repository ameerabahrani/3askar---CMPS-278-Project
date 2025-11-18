import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";
import Navbar from "./components/Navbar";
import Homepage from "./components/Homepage";
import LoginPage from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import MyDrive from "./pages/MyDrive";
import Starred from "./pages/Starred";
import Shared from "./pages/Shared";
import Bin from "./pages/Bin";

function App() {
  return (
    <Router>
      <div style={{ backgroundColor: "#fff", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <Sidebar />
          <div style={{ flex: 1, overflow: "hidden" }}>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/mydrive" element={<MyDrive />} />
              <Route path="/starred" element={<Starred />} />
              <Route path="/shared" element={<Shared />} />
              <Route path="/bin" element={<Bin />} />
              <Route path="/folders/:folderId" element={<Homepage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;

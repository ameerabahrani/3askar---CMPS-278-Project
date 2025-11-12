import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import React from "react";
import Navbar from "./components/Navbar";
import Homepage from "./components/Homepage";


function App() {
  return (
    <div style={{ backgroundColor: "#fff", height: "100vh", overflow: "hidden" }}>
      <Navbar />
      <Homepage />
    </div> 
  );
}

export default App;
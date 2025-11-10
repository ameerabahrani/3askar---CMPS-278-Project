import React from "react";
import Sidebar from "./components/Sidebar";
import { Box } from "@mui/material"

function App() {
  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <Box
        sx={{
          flex: 1,
          bgcolor: "#ffffff",
          p: 2,
        }}
      >
        <h2>Homepage content goes here</h2>
      </Box>
    </Box>
  );
}

export default App;
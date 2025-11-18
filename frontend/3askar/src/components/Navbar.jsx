import { AppBar, Toolbar, Box, Typography, IconButton } from "@mui/material";
import React from "react";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SettingsIcon from "@mui/icons-material/Settings";
import AppsIcon from "@mui/icons-material/Apps";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import SearchBar from "./SearchBar";

function Navbar(){
 

  return (

    <AppBar position = "fixed"
    elevation ={0}
    sx={{bgcolor: "#f8fafd", color: "black", borderBottom: "1px solid #e0e0e0"}}
    >
      <Toolbar sx ={{width: "100%", display: "flex", justifyContent: "space-between", px: 2, boxSizing: "border-box", overflowX: "hidden", alignItems: "center", height: 64}}>

        {/* google drive logo and name */}
        <Box sx={{display: "flex", alignItems: "center", gap: 1.5, ml: 1}}>

          <img
            src="https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png"
            alt="Drive Logo"
            style={{ width: 40, height: 40 }}
          />

            <Typography
              variant="h6"
              sx={{ fontSize: 20, fontWeight: 525, color: "#202124", letterSpacing: 0.2 }}>
              Drive
            </Typography>
        </Box>



        {/* search bar */}
        <SearchBar />




        {/* help settings dotted thingy and avatar */}
        <Box sx={{display: "flex", alignItems: "center", gap: 1}}>

          <IconButton sx={{color: "#5f6368", "&:hover": { color: "#202124" }}}>
              <HelpOutlineIcon/>
          </IconButton>
          <IconButton sx={{color: "#5f6368", "&:hover": { color: "#202124" }}}>
              <SettingsIcon/>
          </IconButton>
          <IconButton sx={{color: "#5f6368", "&:hover": { color: "#202124" }}}>
              <AppsIcon/>
          </IconButton>
          <IconButton sx={{ p: 0.25, ml: 1 }}>
            <Avatar
              alt="User"
              src="https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png"
              sx={{ width: 32, height: 32 }}
            />
          </IconButton>

        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;

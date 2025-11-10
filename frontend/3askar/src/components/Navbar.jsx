import { AppBar, Toolbar, Box, Typography, InputBase, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import {styled, alpha } from "@mui/material/styles";
import React, {useState} from "react";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SettingsIcon from "@mui/icons-material/Settings";
import AppsIcon from "@mui/icons-material/Apps";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";


const SearchContainer = styled('div')(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  borderRadius: 24,
  backgroundColor: alpha(theme.palette.common.black, 0.05),
  padding: theme.spacing(2),
  width: "100%",
  maxWidth: 700,
  height: 48,
}));


function Navbar(){
  const [focused, setFocused] = useState(false);
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
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>


          <SearchContainer sx={{height: "20px" ,backgroundColor : focused? "#ffffff" : "#e9eef6", transition: "background-color 0.2s ease, box-shadow 0.2s ease", boxShadow: focused ? "0 1px 3px rgba(0,0,0,0.2)" : "none", maxWidth: { xs: 280, sm: 500, md: 700},"&:hover": {backgroundColor: focused ? "#ffffff" : "#dfe3eb"},}}>



            <IconButton sx={{mr: 1, color: "#5f6368", "&:hover": { color: "#202124" }}}>
              <Tooltip title="Search">
                <SearchIcon />
              </Tooltip>
            </IconButton>

            <InputBase
              placeholder="Search in Drive"
              sx={{
                flex: 1,
                color: "#000000",
                fontSize: 15,
                ml: 1,
                fontWeight: 700,
                "& .MuiInputBase-input::placeholder": {
                  fontWeight: 700,
                  color: "#000000",
                },
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />


            <IconButton sx={{ml: 1, color: "#5f6368", "&:hover": { color: "#202124" }}}>
              <Tooltip title="Advanced search">
                <TuneIcon />
              </Tooltip>
            </IconButton>

          </SearchContainer>
        </Box>




        {/* help settings dotted thingy and avatar */}
        <Box sx={{display: "flex", alignItems: "center", gap: 1}}>

          <IconButton sx={{color: "#5f6368", "&:hover": { color: "#202124" }}}>
            <Tooltip title="Support">
              <HelpOutlineIcon/>
            </Tooltip>
          </IconButton>
          <IconButton sx={{color: "#5f6368", "&:hover": { color: "#202124" }}}>
            <Tooltip title="Settings">
              <SettingsIcon/>
            </Tooltip>
          </IconButton>
          <IconButton sx={{color: "#5f6368", "&:hover": { color: "#202124" }}}>
            <Tooltip title="Apps">
              <AppsIcon/>
            </Tooltip>
          </IconButton>

          <Tooltip title ="Avatar thingy">
            <Avatar
              alt="User"
              src="https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png"
              sx={{ width: 32, height: 32, ml: 1 }}
            />
            </Tooltip>
            

        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;

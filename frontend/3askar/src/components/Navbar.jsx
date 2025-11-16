import { AppBar, Toolbar, Box, Typography, IconButton, Menu } from "@mui/material";
import React from "react";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SettingsIcon from "@mui/icons-material/Settings";
import AppsIcon from "@mui/icons-material/Apps";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import SearchBar from "./SearchBar";
const API_URL = import.meta.env.VITE_API_URL;



function Navbar(){
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl)
  const [userProfile, setUserProfile] = React.useState(null);

  function handleAvatarClick(event) {
    setAnchorEl(event.currentTarget);
  }
  
  function handleClose(){ 
    setAnchorEl(null);
  }

  React.useEffect(()=> {
    if (open && userProfile === null){
      async function loadProfile(){
        const res = await fetch(`${API_URL}/user/profile`, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        });
        const data = await res.json();
        console.log("PROFILE DATA:", data);

        setUserProfile(data);
      }

      loadProfile();
    }
  }, [open])

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
              <Avatar
                alt="User"
                src="https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png" //TODO: implement the avatar picture from the user to show here or this default one
                sx={{ width: 32, height: 32, ml: 1, cursor: "pointer"}}
                onClick={handleAvatarClick}
              />

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{
                  sx: {
                    borderRadius: 3,          
                    backgroundColor: "#e9eef6", 
                    overflow: "hidden", 
                    mt: 2         
                  }
                }}
            >
              {userProfile ? (
                <Box sx={{ width: 250, display: "flex", flexDirection: "column" }}>

                  {/* Profile Section */}
                  <Box
                    sx={{
                      padding: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Avatar
                      src={userProfile.picture || undefined}
                      sx={{ width: 70, height: 70, mb: 1 }}
                    />

                    <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
                      {userProfile.firstName} {userProfile.lastName} {/* TODO: SUPER SUPER important to implement picture features and encoder in the backend */}
                    </Typography>

                    <Typography sx={{ fontSize: 14, color: "#5f6368" }}>
                      {userProfile.email}
                    </Typography>
                  </Box>

                  {/* Divider */}
                  <Box sx={{ width: "100%", borderBottom: "1px solid #e0e0e0", my: 1 }} />

                  {/* Logout Button */}
                  <Box
                    sx={{
                      padding: 1.5,
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#f1f3f4" },
                      textAlign: "center",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#1a73e8"
                    }}
                    onClick={async () => {
                      await fetch(`${API_URL}/auth/logout`, {
                        method: "GET",
                        credentials: "include"
                      });
                      window.location.href = "/login"; // or "/"
                    }}
                  >
                    Log out
                  </Box>

                </Box>
              ) : (
                <Box sx={{ padding: 2 }}>Loading...</Box>
              )}

            </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;

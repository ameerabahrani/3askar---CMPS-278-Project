import React from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Menu,
  Avatar,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SettingsIcon from "@mui/icons-material/Settings";
import AppsIcon from "@mui/icons-material/Apps";
import MenuIcon from "@mui/icons-material/Menu";
import SearchBar from "./SearchBar";

const API_URL = import.meta.env.VITE_API_URL;

function Navbar({ onDrawerToggle }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [userProfile, setUserProfile] = React.useState(null);

  const menuOpen = Boolean(anchorEl);

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  React.useEffect(() => {
    if (menuOpen && userProfile === null) {
      async function loadProfile() {
        try {
          const res = await fetch(`${API_URL}/user/profile`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });

          if (!res.ok) {
            console.error("Failed to load profile");
            return;
          }

          const data = await res.json();
          console.log("PROFILE DATA:", data);
          setUserProfile(data);
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }

      loadProfile();
    }
  }, [menuOpen, userProfile]);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: "#f8fafd",
        color: "black",
        borderBottom: "1px solid #e0e0e0",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          px: 2,
          boxSizing: "border-box",
          overflowX: "hidden",
          alignItems: "center",
          height: 64,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ mr: 2, display: { md: "none" }, color: "#5f6368" }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo + name */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <img
              src="https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png"
              alt="Drive Logo"
              style={{ width: 40, height: 40 }}
            />
            <Typography
              variant="h6"
              sx={{
                fontSize: 20,
                fontWeight: 525,
                color: "#202124",
                letterSpacing: 0.2,
                display: { xs: "none", sm: "block" },
              }}
            >
              Drive
            </Typography>
          </Box>
        </Box>

        {/* Search bar */}
        <SearchBar />

        {/* Icons + avatar */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>

          <Avatar
            alt="User"
            src="https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png" // TODO: replace with user picture when backend supports it
            sx={{ width: 32, height: 32, ml: 1, cursor: "pointer" }}
            onClick={handleAvatarClick}
          />

          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              sx: {
                borderRadius: 3,
                backgroundColor: "#e9eef6",
                overflow: "hidden",
                mt: 2,
              },
            }}
          >
            {userProfile ? (
              <Box
                sx={{
                  width: 250,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Profile section */}
                <Box
                  sx={{
                    p: 2,
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
                    {userProfile.firstName} {userProfile.lastName}
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: "#5f6368" }}>
                    {userProfile.email}
                  </Typography>
                </Box>

                {/* Divider */}
                <Box
                  sx={{
                    width: "100%",
                    borderBottom: "1px solid #e0e0e0",
                    my: 1,
                  }}
                />

                {/* Logout */}
                <Box
                  sx={{
                    p: 1.5,
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f1f3f4" },
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#1a73e8",
                  }}
                  onClick={async () => {
                    try {
                      await fetch(`${API_URL}/auth/logout`, {
                        method: "GET",
                        credentials: "include",
                      });
                    } catch (err) {
                      console.error("Logout failed:", err);
                    } finally {
                      window.location.href = "/login";
                    }
                  }}
                >
                  Log out
                </Box>
              </Box>
            ) : (
              <Box sx={{ p: 2 }}>Loading...</Box>
            )}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;

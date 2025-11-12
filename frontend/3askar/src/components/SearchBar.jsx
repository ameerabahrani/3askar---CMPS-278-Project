import React, { useState } from "react";
import { Box, InputBase, IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import { styled, alpha } from "@mui/material/styles";

const SearchContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  borderRadius: 24,
  backgroundColor: alpha(theme.palette.common.black, 0.05),
  padding: theme.spacing(2),
  width: "100%",
  maxWidth: 700,
  height: 48,
}));

export default function SearchBar() {
  const [focused, setFocused] = useState(false);

  return (
    <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
      <SearchContainer
        sx={{
          height: "20px",
          backgroundColor: focused ? "#ffffff" : "#e9eef6",
          transition: "background-color 0.2s ease, box-shadow 0.2s ease",
          boxShadow: focused ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
          maxWidth: { xs: 280, sm: 500, md: 700 },
          "&:hover": { backgroundColor: focused ? "#ffffff" : "#dfe3eb" },
        }}
      >
        <IconButton sx={{ mr: 1, color: "#5f6368", "&:hover": { color: "#202124" } }}>
            <SearchIcon />
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

        <IconButton sx={{ ml: 1, color: "#5f6368", "&:hover": { color: "#202124" } }}>
            <TuneIcon />
        </IconButton>
      </SearchContainer>
    </Box>
  );
}

import React from "react";
import { Box, ToggleButton, ToggleButtonGroup, Divider, Button, Menu, MenuItem} from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

function MenuBar() {

  // this is just to make the toggle between files and folders work
  const [view, setView] = React.useState("files");
  const handleChange = (event, newView) => {
    if (newView !== null) setView(newView);
  };

  // for the menu
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [activeFilter, setActiveFilter] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event, filter) => {
    setAnchorEl(event.currentTarget);
    setActiveFilter(filter);
  };
  

  //handleclose should have much more functionality as it is linked to every button on the menu
  const handleClose = () => {
    setAnchorEl(null);
    setActiveFilter(null);
  };


  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        px: 2,
        py: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {/* Files/Folders toggle */}
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={handleChange}
          sx={{
            borderRadius: "9999px",
            overflow: "hidden",
            border: "1px solid #dadce0",
            height: 36,
          }}
        >
          {/* Files button */}
          <ToggleButton
            value="files"
            sx={{
              textTransform: "none",
              fontSize: 14,
              fontWeight: 500,
              px: 2,
              color: "#202124",
              "&.Mui-selected": {
                backgroundColor: "#e8f0fe",
                color: "#1a73e8",
              },
              "&.Mui-selected:hover": {
                backgroundColor: "#e8f0fe",
              },
            }}
          >
            <CheckIcon sx={{ fontSize: 16, mr: 0.5 }} />
            Files
          </ToggleButton>

          {/* Folders button */}
          <ToggleButton
            value="folders"
            sx={{
              textTransform: "none",
              fontSize: 14,
              fontWeight: 500,
              px: 2,
              color: "#202124",
              "&.Mui-selected": {
                backgroundColor: "#e8f0fe",
                color: "#1a73e8",
              },
              "&.Mui-selected:hover": {
                backgroundColor: "#e8f0fe",
              },
            }}
          >
            <FolderOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
            Folders
          </ToggleButton>
        </ToggleButtonGroup>


        <Divider
        orientation="vertical"
        flexItem
        sx ={{
          mx: 1,
          borderColor: "#dadce0"
        }}
        />


        {/* Dropdown */}

        <Button
          endIcon={<ArrowDropDownIcon/>}
          onClick={(e) => handleOpen(e, "type")}
          sx={{
            textTransform: "none",
            fontSize: 14,
            fontWeight: 500,
            color: "#202124",
            border: "1px solid #dadce0",
            borderRadius: "10px",
            px: 2,
            py: 0.5,
            backgroundColor: "#fff",
            "&:hover": {
              backgroundColor: "#f8f9fa",
              borderColor: "#dadce0",
            },
          }}
          >
            Type
        </Button>
        <Button
          endIcon={<ArrowDropDownIcon/>}
          onClick={(e) => handleOpen(e, "people")}
          sx={{
            textTransform: "none",
            fontSize: 14,
            fontWeight: 500,
            color: "#202124",
            border: "1px solid #dadce0",
            borderRadius: "10px",
            px: 2,
            py: 0.5,
            backgroundColor: "#fff",
            "&:hover": {
              backgroundColor: "#f8f9fa",
              borderColor: "#dadce0",
            },
          }}
          >
            People
        </Button>
        <Button
          endIcon={<ArrowDropDownIcon/>}
          onClick={(e) => handleOpen(e, "modified")}
          sx={{
            textTransform: "none",
            fontSize: 14,
            fontWeight: 500,
            color: "#202124",
            border: "1px solid #dadce0",
            borderRadius: "10px",
            px: 2,
            py: 0.5,
            backgroundColor: "#fff",
            "&:hover": {
              backgroundColor: "#f8f9fa",
              borderColor: "#dadce0",
            },
          }}
          >
            Modified
        </Button>
        <Button
          endIcon={<ArrowDropDownIcon/>}
          onClick={(e) => handleOpen(e, "source")}
          sx={{
            textTransform: "none",
            fontSize: 14,
            fontWeight: 500,
            color: "#202124",
            border: "1px solid #dadce0",
            borderRadius: "10px",
            px: 2,
            py: 0.5,
            backgroundColor: "#fff",
            "&:hover": {
              backgroundColor: "#f8f9fa",
              borderColor: "#dadce0",
            },
          }}
          >
            Source
        </Button>

        <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{ list: { disablePadding: true} }}
      >
        {activeFilter === "type" && (
          <>
            <MenuItem onClick={handleClose}>PDF</MenuItem>
            <MenuItem onClick={handleClose}>Images</MenuItem>
            <MenuItem onClick={handleClose}>Videos</MenuItem>
            <MenuItem onClick={handleClose}>Folders</MenuItem>
          </>
        )}
        {activeFilter === "people" && (
          <>
            <MenuItem onClick={handleClose}>Owned by me</MenuItem>
            <MenuItem onClick={handleClose}>Not owned by me</MenuItem>
          </>
        )}
        {activeFilter === "modified" && (
          <>
            <MenuItem onClick={handleClose}>Today</MenuItem>
            <MenuItem onClick={handleClose}>This week</MenuItem>
            <MenuItem onClick={handleClose}>This month</MenuItem>
          </>
        )}
        {activeFilter === "source" && (
          <>
            <MenuItem onClick={handleClose}>My Drive</MenuItem>
            <MenuItem onClick={handleClose}>Shared with me</MenuItem>
            <MenuItem onClick={handleClose}>Starred</MenuItem>
          </>
        )}
      </Menu>

      </Box>
    </Box>
  );
}

export default MenuBar;

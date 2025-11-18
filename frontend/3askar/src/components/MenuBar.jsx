import React from "react";
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useFiles } from "../context/fileContext.jsx";

function MenuBar() {
  const {
    files,
    filterMode,
    setFilterMode,
    typeFilter,
    setTypeFilter,
    peopleFilter,
    setPeopleFilter,
    modifiedFilter,
    setModifiedFilter,
    sourceFilter,
    setSourceFilter,
  } = useFiles();

  // const dynamicTypes = React.useMemo(() => {
  //   const set = new Set();

  //   files.forEach((file) => {
  //     const t = (file.type || "").toLowerCase();

  //     if (t.includes("pdf")) set.add("PDFs");
  //     if (t.includes("image")) set.add("Images");
  //     if (t.includes("video")) set.add("Videos");
  //     if (t.includes("audio")) set.add("Audio");
  //     if (file.type === "folder") set.add("Folders");
  //   });

  //   return Array.from(set);
  // }, [files]);

  const dynamicTypes = React.useMemo(() => {
  const set = new Set();

  files.forEach((file) => { //for "Type" button
    const name = file.name?.toLowerCase() || file.filename?.toLowerCase() || file.originalName?.toLowerCase() || "";

    // Detect by extension (most accurate)
    if (name.endsWith(".pdf")) set.add("PDFs");

    if (/\.(png|jpg|jpeg|gif|webp)$/i.test(name)) set.add("Images");

    if (/\.(mp4|mov|mkv|avi|webm)$/i.test(name)) set.add("Videos");

    if (/\.(mp3|wav|m4a|ogg)$/i.test(name)) set.add("Audio");

    if (/\.(doc|docx|txt|rtf)$/i.test(name)) set.add("Documents");
    if(/\.(xls|xlsx|csv)$/i.test(name)) set.add("Spreadsheets");

    // Folders (based on your file model)
    if (file.type === "folder") set.add("Folders");

    // Backup: check mimetype if available
    const mime = file.type?.toLowerCase() || "";
    if (mime.includes("pdf")) set.add("PDFs");
    if (mime.includes("image")) set.add("Images");
    if (mime.includes("video")) set.add("Videos");
    if (mime.includes("audio")) set.add("Audio");
  });

  return Array.from(set);
}, [files]);

  const handleChange = (_event, newView) => {
    if (newView !== null) setFilterMode(newView);
  };

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [activeFilter, setActiveFilter] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event, filter) => {
    setAnchorEl(event.currentTarget);
    setActiveFilter(filter);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setActiveFilter(null);
  };

  return (
    <Box sx={{ backgroundColor: "#ffffff", px: 2, py: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>

        {/* Files / Folders toggle */}
        <ToggleButtonGroup
          value={filterMode}
          exclusive
          onChange={handleChange}
          sx={{
            borderRadius: "9999px",
            overflow: "hidden",
            border: "1px solid #dadce0",
            height: 36,
          }}
        >
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
            }}
          >
            {filterMode === "files" ? (
              <CheckIcon sx={{ fontSize: 16, mr: 0.5 }} />
            ) : (
              <InsertDriveFileOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
            )}
            Files
          </ToggleButton>

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
            }}
          >
            {filterMode === "folders" ? (
              <CheckIcon sx={{ fontSize: 16, mr: 0.5 }} />
            ) : (
              <FolderOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
            )}
            Folders
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Filter buttons */}
        <Button
          endIcon={<ArrowDropDownIcon />}
          onClick={(e) => handleOpen(e, "type")}
          sx={btnStyle}
        >
          Type
        </Button>

        <Button
          endIcon={<ArrowDropDownIcon />}
          onClick={(e) => handleOpen(e, "people")}
          sx={btnStyle}
        >
          People
        </Button>

        <Button
          endIcon={<ArrowDropDownIcon />}
          onClick={(e) => handleOpen(e, "modified")}
          sx={btnStyle}
        >
          Modified
        </Button>

        <Button
          endIcon={<ArrowDropDownIcon />}
          onClick={(e) => handleOpen(e, "source")}
          sx={btnStyle}
        >
          Location
        </Button>

        {/* Menu */}
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          {/* TYPE FILTER */}
          {activeFilter === "type" &&
            dynamicTypes.map((t) => (
              <MenuItem
                key={t}
                selected={typeFilter === t}
                onClick={() => {
                  setTypeFilter(t);
                  handleClose();
                }}
              >
                {t}
              </MenuItem>
            ))}

          {activeFilter === "type" && dynamicTypes.length > 0 && (
            <MenuItem
              onClick={() => {
                setTypeFilter(null);
                handleClose();
              }}
            >
              Show all
            </MenuItem>
          )}

          {activeFilter === "type" && dynamicTypes.length === 0 && (
            <MenuItem disabled>No types available</MenuItem>
          )}

          {/* PEOPLE FILTER */}
          {activeFilter === "people" && [
            <MenuItem key="owned" onClick={() => { setPeopleFilter("owned"); handleClose(); }}>Owned by me</MenuItem>,
            <MenuItem key="sharedWithMe" onClick={() => { setPeopleFilter("sharedWithMe"); handleClose(); }}>Shared with me</MenuItem>,
            <MenuItem key="sharedByMe" onClick={() => { setPeopleFilter("sharedByMe"); handleClose(); }}>Shared by me</MenuItem>,
          ]}

          {/* MODIFIED */}
          {activeFilter === "modified" && [
            <MenuItem
              key="today"
              selected={modifiedFilter === "today"}
              onClick={() => {
                setModifiedFilter("today");
                handleClose();
              }}
            >
              Today
            </MenuItem>,
            <MenuItem
              key="week"
              selected={modifiedFilter === "week"}
              onClick={() => {
                setModifiedFilter("week");
                handleClose();
              }}
            >
              This week
            </MenuItem>,
            <MenuItem
              key="month"
              selected={modifiedFilter === "month"}
              onClick={() => {
                setModifiedFilter("month");
                handleClose();
              }}
            >
              This month
            </MenuItem>,
            <MenuItem
              key="modified-all"
              onClick={() => {
                setModifiedFilter(null);
                handleClose();
              }}
            >
              Show all
            </MenuItem>,
          ]}

          {/* SOURCE */}
          {activeFilter === "source" && [
            <MenuItem
              key="anywhere"
              onClick={() => {
                setSourceFilter("anywhere");
                handleClose();
              }}
            >
              Anywhere in Drive
            </MenuItem>,
            <MenuItem
              key="mydrive"
              onClick={() => {
                setSourceFilter("myDrive");
                handleClose();
              }}
            >
              My Drive
            </MenuItem>,
            <MenuItem
              key="shared"
              onClick={() => {
                setSourceFilter("shared");
                handleClose();
              }}
            >
              Shared with me
            </MenuItem>,
          ]}
        </Menu>

      </Box>
    </Box>
  );
}

const btnStyle = {
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
  },
};

export default MenuBar;

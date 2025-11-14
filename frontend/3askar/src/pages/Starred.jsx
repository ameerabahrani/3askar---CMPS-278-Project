import React from "react";
import { Box, Typography, IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuBar from "../components/MenuBar";
import StarIcon from "@mui/icons-material/Star";

function Starred() {
  const [sortField, setSortField] = React.useState("name");
  const [sortDirection, setSortDirection] = React.useState("asc");
  const [menuEl, setMenuEl] = React.useState(null);

  const allFiles = [
    {
      id: 1,
      name: "AI Ethics Assignment.pdf",
      sharedBy: "professor@aub.edu.lb",
      date: "Nov 5, 2025",
      isStarred: true,
      icon: "https://www.gstatic.com/images/icons/material/system/2x/picture_as_pdf_black_24dp.png",
    },
    {
      id: 2,
      name: "Group Project Slides.pptx",
      sharedBy: "teamleader@gmail.com",
      date: "Jan 24, 2023",
      isStarred: false,
      icon: "https://www.gstatic.com/images/icons/material/system/2x/slideshow_black_24dp.png",
    },
    {
      id: 3,
      name: "Research Data Sheet.xlsx",
      sharedBy: "labassistant@aub.edu.lb",
      date: "Oct 5, 2025",
      isStarred: true,
      icon: "https://www.gstatic.com/images/icons/material/system/2x/grid_on_black_24dp.png",
    },
  ];

  const starredFiles = allFiles.filter((file) => file.isStarred);

  const handleOpenMenu = (event) => setMenuEl(event.currentTarget);
  const handleCloseMenu = () => setMenuEl(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortData = (data) =>
    [...data].sort((a, b) => {
      let fieldA = a[sortField];
      let fieldB = b[sortField];

      if (sortField === "date") {
        fieldA = new Date(fieldA);
        fieldB = new Date(fieldB);
      } else {
        fieldA = fieldA.toString().toLowerCase();
        fieldB = fieldB.toString().toLowerCase();
      }

      if (fieldA < fieldB) return sortDirection === "asc" ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const sortedFiles = sortData(starredFiles);

  const renderSortIndicator = (field) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        padding: 10,
        marginTop: "64px",
        backgroundColor: "#ffffff",
        height: "calc(100vh - 64px)",
        overflowY: "auto",
        color: "#000000ff",
        borderTopLeftRadius: 12,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Starred
      </Typography>

      <MenuBar />

      <Box
        sx={{
          display: "flex",
          px: 2,
          py: 1,
          mt: 2,
          borderBottom: "1px solid #e0e0e0",
          fontWeight: 500,
          fontSize: 14,
          color: "#5f6368",
          cursor: "pointer",
        }}
      >
        <Box sx={{ flex: 4 }} onClick={() => handleSort("name")}>
          Name{renderSortIndicator("name")}
        </Box>

        <Box sx={{ flex: 3 }} onClick={() => handleSort("sharedBy")}>
          Shared by{renderSortIndicator("sharedBy")}
        </Box>

        <Box sx={{ flex: 2 }} onClick={() => handleSort("date")}>
          Date shared{renderSortIndicator("date")}
        </Box>

        <Box sx={{ width: 40 }} />
      </Box>

      {sortedFiles.map((file) => (
        <Box
          key={file.id}
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 1.5,
            borderBottom: "1px solid #f1f3f4",
            "&:hover": { backgroundColor: "#f8f9fa" },
          }}
        >
          <Box sx={{ flex: 4, display: "flex", alignItems: "center", gap: 1.5 }}>
            {file.isStarred && <StarIcon sx={{ color: "#f7cb4d", fontSize: 20 }} />}

            <img src={file.icon} width={20} height={20} alt="file icon" />
            {file.name}
          </Box>

          <Box sx={{ flex: 3, color: "#5f6368" }}>{file.sharedBy}</Box>
          <Box sx={{ flex: 2, color: "#5f6368" }}>{file.date}</Box>

          <IconButton onClick={handleOpenMenu}>
            <MoreVertIcon sx={{ color: "#5f6368" }} />
          </IconButton>
        </Box>
      ))}

      <Menu anchorEl={menuEl} open={Boolean(menuEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleCloseMenu}>Open</MenuItem>
        <MenuItem onClick={handleCloseMenu}>Remove from Starred</MenuItem>
      </Menu>
    </Box>
  );
}

export default Starred;

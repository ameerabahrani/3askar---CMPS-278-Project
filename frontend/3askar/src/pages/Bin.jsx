import React from "react";
import { Box, Typography, IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuBar from "../components/MenuBar";

function Bin() {
    const allFiles = [ //TODO: original location
    {
      id: 1,
      name: "AI Ethics Assignment.pdf",
      owner: "professor@aub.edu.lb",
      dateDeleted: "Nov 7, 2025",
      isDeleted: true,
      originalLocation: "My Drive", 
      icon: "https://www.gstatic.com/images/icons/material/system/2x/picture_as_pdf_black_24dp.png",
    },
    {
      id: 2,
      name: "Group Project Slides.pptx",
      owner: "teamleader@gmail.com",
      dateDeleted: "Jan 9, 2024",
      isDeleted: false,
      originalLocation: "My Drive",
      icon: "https://www.gstatic.com/images/icons/material/system/2x/slideshow_black_24dp.png",
    },
    {
      id: 3,
      name: "Research Data Sheet.xlsx",
      owner: "labassistant@aub.edu.lb",
      dateDeleted: "Nov 18, 2025",
      isDeleted: false,
      originalLocation: "Shared with me",
      icon: "https://www.gstatic.com/images/icons/material/system/2x/grid_on_black_24dp.png",
    },

    {
      id: 4,
      name: "Hello.pdf",
      owner: "labassistant@aub.edu.lb",
      dateDeleted: "Oct 5, 2025",
      isDeleted: true,
      originalLocation: "My Drive",
      icon: "https://www.gstatic.com/images/icons/material/system/2x/grid_on_black_24dp.png",
    },
  ];
  
  const [files, setFiles] = React.useState([]);
  const [activeFile, setActiveFile] = React.useState(null);
  const [sortField, setSortField] = React.useState("name");
  const [sortDirection, setSortDirection] = React.useState("asc");
  const [menuEl, setMenuEl] = React.useState(null);

  React.useEffect(()=> {
    setFiles(allFiles);
  }, []);


  const deletedFiles = files.filter((file) => file.isDeleted);

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

      if (sortField === "dateDeleted") {
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

  const sortedFiles = sortData(deletedFiles);

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
        Trash
      </Typography>


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

        <Box sx={{ flex: 3 }} onClick={() => handleSort("owner")}>
          Owner {renderSortIndicator("owner")}
        </Box>

        <Box sx={{ flex: 2 }} onClick={() => handleSort("originalLocation")}>
          Original location {renderSortIndicator("originalLocation")}
        </Box>
        <Box sx={{ flex: 1 }} onClick={() => handleSort("dateDeleted")}>
          Date deleted {renderSortIndicator("dateDeleted")}
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

            <img src={file.icon} width={20} height={20} alt="file icon" />
            {file.name}
          </Box>
          <Box sx={{ flex: 3, color: "#5f6368" }}>{file.originalLocation}</Box>
          <Box sx={{ flex: 2, color: "#5f6368" }}>{file.owner}</Box>
          <Box sx={{ flex: 1, color: "#5f6368" }}>{file.dateDeleted}</Box>

          <IconButton onClick={handleOpenMenu}>
            <MoreVertIcon sx={{ color: "#5f6368" }} />
          </IconButton>
        </Box>
      ))}

      <Menu anchorEl={menuEl} open={Boolean(menuEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleCloseMenu}>Restore</MenuItem>
        <MenuItem onClick={handleCloseMenu}>Delete forever</MenuItem>
      </Menu>
    </Box>
  );
}

export default Bin;

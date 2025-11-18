import React from "react";
import { Box, Typography, IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import StarIcon from "@mui/icons-material/Star";
import MenuBar from "../components/MenuBar";
import { useFiles } from "../context/fileContext.jsx";

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString();
};

function Starred() {
  const { filteredFiles, filterBySource, loading, error } = useFiles();

  const [sortField, setSortField] = React.useState("name");
  const [sortDirection, setSortDirection] = React.useState("asc");
  const [menuEl, setMenuEl] = React.useState(null);

  const starredFiles = React.useMemo(
    () => filterBySource(filteredFiles, "starred"),
    [filteredFiles, filterBySource]
  );

  const sortedFiles = React.useMemo(() => {
    return [...starredFiles].sort((a, b) => {
      const valueA =
        sortField === "date"
          ? Number(new Date(a.lastAccessedAt || a.uploadedAt || a.date))
          : (a[sortField] ?? "").toString().toLowerCase();

      const valueB =
        sortField === "date"
          ? Number(new Date(b.lastAccessedAt || b.uploadedAt || b.date))
          : (b[sortField] ?? "").toString().toLowerCase();

      if (sortDirection === "asc") return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    });
  }, [starredFiles, sortField, sortDirection]);

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

  const renderSortIndicator = (field) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  if (loading) {
    return <Typography sx={{ p: 2 }}>Loading starred items...</Typography>;
  }

  if (error) {
    return (
      <Typography sx={{ p: 2, color: "#d93025" }}>
        {error}
      </Typography>
    );
  }

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

        <Box sx={{ flex: 3 }} onClick={() => handleSort("owner")}>
          Owner{renderSortIndicator("owner")}
        </Box>

        <Box sx={{ flex: 2 }} onClick={() => handleSort("date")}>
          Date starred{renderSortIndicator("date")}
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
            <StarIcon sx={{ color: "#f7cb4d", fontSize: 20 }} />
            <img src={file.icon} width={20} height={20} alt="file icon" />
            {file.name}
          </Box>

          <Box sx={{ flex: 3, color: "#5f6368" }}>
            {file.owner || "Unknown"}
          </Box>

          <Box sx={{ flex: 2, color: "#5f6368" }}>
            {formatDate(file.lastAccessedAt || file.uploadedAt)}
          </Box>

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

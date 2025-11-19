import React from "react";
import { Box, Typography, IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuBar from "../components/MenuBar";
import { useFiles } from "../context/fileContext.jsx";

const DEFAULT_FILE_ICON =
  "https://www.gstatic.com/images/icons/material/system/2x/insert_drive_file_black_24dp.png";

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString();
};

const getSortValue = (file, field) => {
  switch (field) {
    case "name":
      return file.name || "";
    case "owner":
      return file.owner || "";
    case "date":
      return file.lastAccessedAt || file.uploadedAt || "";
    default:
      return "";
  }
};

function Shared() {
  const { filteredFiles, loading, error, filterBySource } = useFiles();

  const [sortField, setSortField] = React.useState("name");
  const [sortDirection, setSortDirection] = React.useState("asc");
  const [menuEl, setMenuEl] = React.useState(null);
  const [activeFile, setActiveFile] = React.useState(null);

  const sharedFiles = React.useMemo(
    () => filterBySource(undefined, "shared"),
    [filterBySource]
  );

  const sortedFiles = React.useMemo(() => {
    const data = [...sharedFiles];
    data.sort((a, b) => {
      const valueA = getSortValue(a, sortField);
      const valueB = getSortValue(b, sortField);

      if (sortField === "date") {
        const timeA = Number(new Date(valueA));
        const timeB = Number(new Date(valueB));
        if (sortDirection === "asc") {
          return (Number.isNaN(timeA) ? 0 : timeA) - (Number.isNaN(timeB) ? 0 : timeB);
        }
        return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
      }

      const textA = valueA?.toString().toLowerCase() ?? "";
      const textB = valueB?.toString().toLowerCase() ?? "";
      if (textA < textB) return sortDirection === "asc" ? -1 : 1;
      if (textA > textB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [sharedFiles, sortField, sortDirection]);

  const handleOpenMenu = (event, file) => {
    setMenuEl(event.currentTarget);
    setActiveFile(file);
  };

  const handleCloseMenu = () => {
    setMenuEl(null);
    setActiveFile(null);
  };

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
    return <Typography sx={{ p: 2 }}>Loading shared files...</Typography>;
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
        Shared with me
      </Typography>

      <MenuBar visibleFiles={sortedFiles} />

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
          Shared by{renderSortIndicator("owner")}
        </Box>

        <Box sx={{ flex: 2 }} onClick={() => handleSort("date")}>
          Date shared{renderSortIndicator("date")}
        </Box>

        <Box sx={{ width: 40 }} />
      </Box>

      {!sortedFiles.length ? (
        <Typography sx={{ px: 2, py: 3, color: "#5f6368" }}>
          Nothing has been shared with you yet.
        </Typography>
      ) : (
        sortedFiles.map((file) => (
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
              <img
                src={file.icon || DEFAULT_FILE_ICON}
                width={20}
                height={20}
                alt="file icon"
              />
              {file.name}
            </Box>

            <Box sx={{ flex: 3, color: "#5f6368" }}>
              {file.owner || "Unknown"}
            </Box>

            <Box sx={{ flex: 2, color: "#5f6368" }}>
              {formatDate(file.lastAccessedAt || file.uploadedAt)}
            </Box>

            <IconButton onClick={(event) => handleOpenMenu(event, file)}>
              <MoreVertIcon sx={{ color: "#5f6368" }} />
            </IconButton>
          </Box>
        ))
      )}

      <Menu anchorEl={menuEl} open={Boolean(menuEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleCloseMenu}>Open</MenuItem>
        <MenuItem onClick={handleCloseMenu}>Download</MenuItem>
        <MenuItem onClick={handleCloseMenu}>Remove</MenuItem>
      </Menu>
    </Box>
  );
}

export default Shared;

import React from "react";
import { Box, Typography, IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuBar from "../components/MenuBar";
import { useFiles } from "../context/fileContext.jsx";

const DEFAULT_FILE_ICON =
  "https://www.gstatic.com/images/icons/material/system/2x/insert_drive_file_black_24dp.png";

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
};

const getSortValue = (file, field) => {
  switch (field) {
    case "name":
      return file.name || "";
    case "owner":
      return file.owner || "";
    case "originalLocation":
      return file.location || "My Drive";
    case "dateDeleted":
      return file.deletedAt || file.lastAccessedAt || file.uploadedAt || "";
    default:
      return "";
  }
};

function Bin() {
  const { files, loading, restoreFromBin, deleteForever } = useFiles();
  const [sortField, setSortField] = React.useState("name");
  const [sortDirection, setSortDirection] = React.useState("asc");
  const [menuEl, setMenuEl] = React.useState(null);
  const [activeFile, setActiveFile] = React.useState(null);

  const deletedFiles = React.useMemo(
    () => files.filter((file) => file.isDeleted),
    [files]
  );

  const sortedFiles = React.useMemo(() => {
    const data = [...deletedFiles];
    data.sort((a, b) => {
      const valueA = getSortValue(a, sortField);
      const valueB = getSortValue(b, sortField);

      if (sortField === "dateDeleted") {
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
  }, [deletedFiles, sortField, sortDirection]);

  const handleOpenMenu = (event, file) => {
    setMenuEl(event.currentTarget);
    setActiveFile(file);
  };

  const handleCloseMenu = () => {
    setMenuEl(null);
    setActiveFile(null);
  };

  const handleRestore = () => {
    if (activeFile) {
      restoreFromBin(activeFile.id);
    }
    handleCloseMenu();
  };

  const handleDeleteForever = () => {
    if (activeFile) {
      deleteForever(activeFile.id);
    }
    handleCloseMenu();
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
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  if (loading) {
    return <Typography sx={{ p: 2 }}>Loading trash...</Typography>;
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
        Trash
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

        <Box sx={{ flex: 2 }} onClick={() => handleSort("originalLocation")}>
          Original location{renderSortIndicator("originalLocation")}
        </Box>
        <Box sx={{ flex: 1 }} onClick={() => handleSort("dateDeleted")}>
          Date deleted{renderSortIndicator("dateDeleted")}
        </Box>

        <Box sx={{ width: 40 }} />
      </Box>

      {!sortedFiles.length ? (
        <Typography sx={{ px: 2, py: 3, color: "#5f6368" }}>
          Bin is empty.
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
            <Box sx={{ flex: 3, color: "#5f6368" }}>{file.owner || "Unknown"}</Box>
            <Box sx={{ flex: 2, color: "#5f6368" }}>
              {file.location || "My Drive"}
            </Box>
            <Box sx={{ flex: 1, color: "#5f6368" }}>
              {formatDate(file.deletedAt || file.lastAccessedAt || file.uploadedAt)}
            </Box>

            <IconButton onClick={(event) => handleOpenMenu(event, file)}>
              <MoreVertIcon sx={{ color: "#5f6368" }} />
            </IconButton>
          </Box>
        ))
      )}

      <Menu anchorEl={menuEl} open={Boolean(menuEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleRestore}>Restore</MenuItem>
        <MenuItem onClick={handleDeleteForever}>Delete forever</MenuItem>
      </Menu>
    </Box>
  );
}

export default Bin;

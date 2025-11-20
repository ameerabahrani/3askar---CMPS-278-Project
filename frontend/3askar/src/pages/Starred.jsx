import React from "react";
import { Box, Typography, Menu, MenuItem } from "@mui/material";
import MenuBar from "../components/MenuBar";
import { useFiles } from "../context/fileContext.jsx";
import HoverActions from "../components/HoverActions.jsx";
import ShareDialog from "../components/ShareDialog.jsx";
import RenameDialog from "../components/RenameDialog.jsx";

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString();
};

function Starred() {
  const {
    filterBySource,
    loading,
    error,
    toggleStar,
    renameFile,
    downloadFile,
  } = useFiles();

  const [sortField, setSortField] = React.useState("name");
  const [sortDirection, setSortDirection] = React.useState("asc");
  const [menuEl, setMenuEl] = React.useState(null);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [fileToShare, setFileToShare] = React.useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [fileToRename, setFileToRename] = React.useState(null);

  const starredFiles = React.useMemo(
    () => filterBySource(undefined, "starred"),
    [filterBySource]
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

  const handleOpenMenu = (event) => {
    event.stopPropagation?.();
    setMenuEl(event.currentTarget);
  };
  const handleCloseMenu = () => setMenuEl(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const openShareDialog = (file) => {
    setFileToShare(file);
    setShareDialogOpen(true);
  };

  const closeShareDialog = () => {
    setShareDialogOpen(false);
    setFileToShare(null);
  };

  const openRenameDialog = (file) => {
    setFileToRename(file);
    setRenameDialogOpen(true);
  };

  const closeRenameDialog = () => {
    setRenameDialogOpen(false);
    setFileToRename(null);
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
          Owner{renderSortIndicator("owner")}
        </Box>

        <Box sx={{ flex: 2 }} onClick={() => handleSort("date")}>
          Date starred{renderSortIndicator("date")}
        </Box>

        <Box sx={{ width: 40 }} />
      </Box>

      {sortedFiles.map((file) => (
        <HoverActions
          key={file.id}
          file={file}
          toggleStar={toggleStar}
          openShareDialog={openShareDialog}
          openRenameDialog={openRenameDialog}
          openMenu={handleOpenMenu}
          downloadFile={downloadFile}
          formatDate={formatDate}
        />
      ))}

      <Menu anchorEl={menuEl} open={Boolean(menuEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleCloseMenu}>Open</MenuItem>
        <MenuItem onClick={handleCloseMenu}>Remove from Starred</MenuItem>
      </Menu>
      <RenameDialog
        open={renameDialogOpen}
        file={fileToRename}
        onClose={closeRenameDialog}
        onSubmit={(newName) => {
          if (!fileToRename) return;
          renameFile(fileToRename.id, newName);
          closeRenameDialog();
        }}
      />
      <ShareDialog
        open={shareDialogOpen}
        file={fileToShare}
        onClose={closeShareDialog}
      />
    </Box>
  );
}

export default Starred;

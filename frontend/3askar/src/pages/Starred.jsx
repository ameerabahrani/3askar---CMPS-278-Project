import React from "react";
import { Box, Typography, IconButton, Menu, MenuItem, Checkbox, Grid, Paper } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import StarIcon from "@mui/icons-material/Star";
import FolderIcon from "@mui/icons-material/Folder";
import MenuBar from "../components/MenuBar";
import BatchToolbar from "../components/BatchToolbar";
import { useFiles } from "../context/fileContext.jsx";
import FileKebabMenu from "../components/FileKebabMenu.jsx";
import { isFolder } from "../utils/fileHelpers";
import { getRowStyles, getCardStyles, checkboxOverlayStyles } from "../styles/selectionTheme";

const DEFAULT_FILE_ICON =
  "https://www.gstatic.com/images/icons/material/system/2x/insert_drive_file_black_24dp.png";
import HoverActions from "../components/HoverActions.jsx";
import RenameDialog from "../components/RenameDialog";
import ShareDialog from "../components/ShareDialog.jsx";
import BatchMoveDialog from "../components/BatchMoveDialog.jsx";
import { downloadFolderZip, updateFolder } from "../api/foldersApi.js";

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString();
};

function Starred() {
  const {
    filteredFiles,
    filterBySource,
    loading,
    error,
    moveToTrash,
    toggleStar,
    renameFile,
    downloadFile,
    batchMove,
    refreshFiles,
    selectedFiles,
    selectedFolders,
    toggleFileSelection,
    toggleFolderSelection,
    clearSelection,
    selectAll,
    starredFiles: contextStarredFiles,
  } = useFiles();

  const [viewMode, setViewMode] = React.useState("list");
  const [sortField, setSortField] = React.useState("name");
  const [sortDirection, setSortDirection] = React.useState("asc");
  const [menuEl, setMenuEl] = React.useState(null);

  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [menuPosition, setMenuPosition] = React.useState(null);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [fileToRename, setFileToRename] = React.useState(null);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [fileToShare, setFileToShare] = React.useState(null);
  const [moveDialogOpen, setMoveDialogOpen] = React.useState(false);
  const [moveTarget, setMoveTarget] = React.useState(null);

  const menuOpen = Boolean(menuAnchorEl) || Boolean(menuPosition);

  const anchorPosition = menuPosition
    ? { top: menuPosition.mouseY, left: menuPosition.mouseX }
    : undefined;

  const handleMenuButtonClick = (event, file) => {
    event.stopPropagation?.();
    setSelectedFile(file);
    setMenuPosition(null);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleContextMenu = (event, file) => {
    event.preventDefault();
    event.stopPropagation?.();
    setSelectedFile(file);
    setMenuAnchorEl(null);
    setMenuPosition({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
    });
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuPosition(null);
    setSelectedFile(null);
  };

  const openShareDialog = (file) => {
    if (!file) return;
    if (isFolder(file)) {
      setFileToShare({
        ...file,
        isFolder: true,
        id: file.id || file._id || file.publicId,
        name: file.name,
      });
    } else {
      setFileToShare(file);
    }
    setShareDialogOpen(true);
  };

  const openRenameDialog = (file) => {
    if (!file) return;
    setFileToRename(file);
    setRenameDialogOpen(true);
  };

  const handleStartMove = (item) => {
    setMoveTarget(item);
    setMoveDialogOpen(true);
  };

  const handleMoveConfirm = async (destinationFolderId) => {
    if (!moveTarget) return;
    const isFolderItem = isFolder(moveTarget);
    const id = moveTarget.id || moveTarget._id || moveTarget.publicId;
    try {
      await batchMove(
        isFolderItem ? [] : [id],
        isFolderItem ? [id] : [],
        destinationFolderId
      );
      await refreshFiles();
    } finally {
      setMoveDialogOpen(false);
      setMoveTarget(null);
    }
  };

  const handleDownload = (item) => {
    if (!item) return;
    const id = item.id || item._id || item.publicId;
    if (isFolder(item)) {
      downloadFolderZip(id);
    } else {
      downloadFile(item);
    }
  };

  const handleRenameSubmit = async (newName) => {
    if (!fileToRename) return;
    const trimmed = (newName || "").trim();
    if (!trimmed) {
      setRenameDialogOpen(false);
      setFileToRename(null);
      return;
    }
    const id = fileToRename.id || fileToRename._id || fileToRename.publicId;
    if (isFolder(fileToRename)) {
      await updateFolder(id, { name: trimmed });
    } else {
      await renameFile(id, trimmed);
    }
    await refreshFiles();
    setRenameDialogOpen(false);
    setFileToRename(null);
  };

  React.useEffect(() => {
    clearSelection();
  }, [clearSelection]);


  const starredFiles = React.useMemo(
    () => {
      // If we have starredFiles from context (which includes folders), use it.
      // But we also need to make sure we don't duplicate if filterBySource also returns them?
      // Actually, filterBySource(undefined, "starred") uses pickSourceList("starred") which uses combinedFiles.
      // combinedFiles in fileContext now needs to include starredFiles?
      // Let's check fileContext again. 
      // I didn't update combinedFiles to include starredFiles.
      // So filterBySource won't see starred folders unless I update combinedFiles OR I just use starredFiles directly here.
      // Using starredFiles directly is safer if I expose it.
      // I exposed starredFiles in fileContext.
      return contextStarredFiles || [];
    },
    [contextStarredFiles]
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

  const selectedCount = React.useMemo(
    () => sortedFiles.reduce((acc, f) => {
      const isFolderItem = isFolder(f);
      const set = isFolderItem ? selectedFolders : selectedFiles;
      return set.has(f.id) ? acc + 1 : acc;
    }, 0),
    [sortedFiles, selectedFiles, selectedFolders]
  );
  const allSelected = selectedCount > 0 && selectedCount === sortedFiles.length;
  const someSelected = selectedCount > 0 && selectedCount < sortedFiles.length;

  const handleHeaderToggle = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(sortedFiles);
    }
  };

  const isItemSelected = (file) => {
    const isFolderItem = isFolder(file);
    return (isFolderItem ? selectedFolders : selectedFiles).has(file.id);
  };

  const toggleSelectionFor = (file) => {
    const isFolderItem = isFolder(file);
    if (isFolderItem) toggleFolderSelection(file.id); else toggleFileSelection(file.id);
  };

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
    return sortDirection === "asc" ? " ^" : " v";
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
        px: { xs: 2, md: 4 },
        pt: 3,
        pb: 6,
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

      {selectedCount > 0 ? <BatchToolbar visibleItems={sortedFiles} /> : <MenuBar visibleFiles={sortedFiles} />}

      {/* View Mode Toggle Buttons */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, mb: 1 }}>
        <IconButton
          size="small"
          onClick={() => setViewMode("list")}
          sx={{ color: viewMode === "list" ? "#1a73e8" : "#5f6368" }}
        >
          <ListIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => setViewMode("grid")}
          sx={{ color: viewMode === "grid" ? "#1a73e8" : "#5f6368" }}
        >
          <GridViewIcon />
        </IconButton>
      </Box>

      {viewMode === "list" ? (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
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
            <Box sx={{ width: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Checkbox
                size="small"
                indeterminate={someSelected && !allSelected}
                checked={allSelected}
                onChange={handleHeaderToggle}
              />
            </Box>
            <Box sx={{ flex: 4 }} onClick={() => handleSort("name")}>
              Name{renderSortIndicator("name")}
            </Box>

            <Box sx={{ flex: 3, display: { xs: 'none', md: 'block' } }} onClick={() => handleSort("owner")}>
              Owner{renderSortIndicator("owner")}
            </Box>

            <Box sx={{ flex: 2, display: { xs: 'none', md: 'block' } }} onClick={() => handleSort("date")}>
              Date starred{renderSortIndicator("date")}
            </Box>

            <Box sx={{ width: 40 }} />
          </Box>

          {sortedFiles.map((file) => {
            const selected = isItemSelected(file);
            return (
              <Box
                key={file.id}
                onContextMenu={(e) => handleContextMenu(e, file)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 2,
                  py: 1.5,
                  borderBottom: "1px solid #f1f3f4",
                  ...getRowStyles(selected),
                }}
              >
                <Box sx={{ width: 40, display: "flex", justifyContent: "center" }}>
                  <Checkbox
                    size="small"
                    checked={selected}
                    onChange={(e) => { e.stopPropagation(); toggleSelectionFor(file); }}
                  />
                </Box>
                <Box sx={{ flex: 1, display: "flex", width: "100%" }}>
                  <HoverActions
                    file={file}
                    sx={{ flex: 1 }}
                    toggleStar={() => toggleStar(file.id)}
                    openShareDialog={openShareDialog}
                    openRenameDialog={openRenameDialog}
                    openMenu={(event) => handleMenuButtonClick(event, file)}
                    downloadFile={handleDownload}
                    formatDate={formatDate}
                    disableWrapper={true}
                    renderContent={(f) => (
                      <>
                        <Box sx={{ flex: 4, display: "flex", alignItems: "center", gap: 1.5 }}>
                          <StarIcon sx={{ color: "#f7cb4d", fontSize: 20 }} />
                          {isFolder(f) ? (
                            <FolderIcon sx={{ color: "#5f6368", fontSize: 20 }} />
                          ) : (
                            <img src={f.icon} width={20} height={20} alt="file icon" />
                          )}
                          {f.name}
                        </Box>

                        <Box sx={{ flex: 3, color: "#5f6368" }}>
                          {f.owner || "Unknown"}
                        </Box>

                        <Box sx={{ flex: 2, color: "#5f6368" }}>
                          {formatDate(f.lastAccessedAt || f.uploadedAt)}
                        </Box>
                      </>
                    )}
                  />
                </Box>
              </Box>
            );
          })}
        </>
      ) : (
        /* GRID VIEW */
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {sortedFiles.map((file) => {
            const selected = isItemSelected(file);
            return (
              <Grid item xs={6} sm={4} md={3} lg={2} key={file.id}>
                <Paper
                  elevation={0}
                  sx={{
                    position: "relative",
                    borderRadius: 2,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    ...getCardStyles(selected),
                  }}
                  onClick={() => { /* placeholder */ }}
                >
                  {/* Grid view checkbox overlay */}
                  <Checkbox
                    size="small"
                    checked={selected}
                    onChange={(e) => { e.stopPropagation(); toggleSelectionFor(file); }}
                    sx={checkboxOverlayStyles}
                  />
                  <IconButton
                    size="small"
                    sx={{ position: "absolute", top: 4, right: 4, zIndex: 2 }}
                    onClick={(e) => { e.stopPropagation(); handleMenuButtonClick(e, file); }}
                  >
                    <MoreVertIcon sx={{ color: "#5f6368" }} />
                  </IconButton>

                  <Box
                    sx={{
                      height: 120,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#f8f9fa",
                      position: "relative",
                    }}
                  >
                    <StarIcon
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        color: "#f7cb4d",
                        fontSize: 20,
                      }}
                    />
                    {isFolder(file) ? (
                      <FolderIcon sx={{ fontSize: 40, color: "#4285f4" }} />
                    ) : (
                      <img
                        src={file.icon || DEFAULT_FILE_ICON}
                        width={40}
                        height={40}
                        alt="file type"
                      />
                    )}
                  </Box>

                  <Box sx={{ p: 1.5 }}>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: 14,
                        mb: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </Typography>
                    <Typography
                      sx={{
                        color: "#5f6368",
                        fontSize: 12,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.owner || "Unknown"}
                    </Typography>
                    <Typography sx={{ color: "#5f6368", fontSize: 12 }}>
                      {formatDate(file.lastAccessedAt || file.uploadedAt)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      <FileKebabMenu
        anchorEl={menuAnchorEl}
        anchorPosition={anchorPosition}
        open={menuOpen}
        onClose={handleMenuClose}
        selectedFile={selectedFile}
        onStartShare={openShareDialog}
        onStartRename={openRenameDialog}
        onStartMove={handleStartMove}
        onRename={selectedFile && isFolder(selectedFile) ? () => openRenameDialog(selectedFile) : undefined}
        onFolderShare={selectedFile && isFolder(selectedFile) ? () => openShareDialog(selectedFile) : undefined}
        onDownloadFolder={selectedFile && isFolder(selectedFile) ? () => handleDownload(selectedFile) : undefined}
        onToggleStar={selectedFile && isFolder(selectedFile) ? () => toggleStar(selectedFile.id) : undefined}
        onTrash={selectedFile && isFolder(selectedFile) ? () => moveToTrash(selectedFile.id) : undefined}
        onMove={selectedFile && isFolder(selectedFile) ? () => handleStartMove(selectedFile) : undefined}
        isStarred={selectedFile?.isStarred}
        isInTrash={selectedFile?.isDeleted}
      />

      <RenameDialog
        open={renameDialogOpen}
        file={fileToRename}
        onClose={() => {
          setRenameDialogOpen(false);
          setFileToRename(null);
        }}
        onSubmit={handleRenameSubmit}
      />

      <ShareDialog
        open={shareDialogOpen}
        file={fileToShare}
        onClose={() => {
          setShareDialogOpen(false);
          setFileToShare(null);
        }}
      />

      <BatchMoveDialog
        open={moveDialogOpen}
        onClose={() => {
          setMoveDialogOpen(false);
          setMoveTarget(null);
        }}
        onMove={handleMoveConfirm}
        selectedCount={1}
        excludedFolderIds={moveTarget && isFolder(moveTarget) ? [moveTarget.id || moveTarget._id || moveTarget.publicId] : []}
      />
    </Box>
  );
}

export default Starred;



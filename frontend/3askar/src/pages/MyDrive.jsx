import React, { useEffect, useMemo } from "react";
import { Box, Typography, IconButton, Grid, Paper, Checkbox } from "@mui/material";
import MenuBar from "../components/MenuBar";
import BatchToolbar from "../components/BatchToolbar";
import { isFolder } from "../utils/fileHelpers";
import { getRowStyles, getCardStyles, checkboxOverlayStyles } from "../styles/selectionTheme"; // PG-2: batch toolbar
import FolderIcon from "@mui/icons-material/Folder";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import StarIcon from "@mui/icons-material/Star";
import { useFiles } from "../context/fileContext.jsx"; // PG-1: selection hooks
import FileKebabMenu from "../components/FileKebabMenu";
import RenameDialog from "../components/RenameDialog";
import ShareDialog from "../components/ShareDialog.jsx";
import DetailsPanel from "../components/DetailsPanel.jsx";
import HoverActions from "../components/HoverActions.jsx";

const DEFAULT_FILE_ICON =
  "https://www.gstatic.com/images/icons/material/system/2x/insert_drive_file_black_24dp.png";

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString();
};

function MyDrive() {
  const {
    filteredFiles,
    loading,
    error,
    toggleStar,
    renameFile,
    downloadFile,
    selectedFiles,
    selectedFolders,
    toggleFileSelection,
    toggleFolderSelection,
    clearSelection,
    selectAll,
  } = useFiles();

  // DETAILS PANEL
  const [detailsPanelOpen, setDetailsPanelOpen] = React.useState(false);
  const [detailsFile, setDetailsFile] = React.useState(null);

  const [viewMode, setViewMode] = React.useState("list");

  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [fileToRename, setFileToRename] = React.useState(null);

  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [fileToShare, setFileToShare] = React.useState(null);

  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [selectedFile, setSelectedFile] = React.useState(null);

  const openMenu = (event, file) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedFile(file);
  };

  useEffect(() => {
    clearSelection();
  }, [clearSelection]);

  const closeMenu = () => {
    setMenuAnchorEl(null);
    setSelectedFile(null);
  };

  // Hover Action functions 
  const openShareDialog = (file) => {
    setFileToShare(file);
    setShareDialogOpen(true);
  };

  const openRenameDialog = (file) => {
    setFileToRename(file);
    setRenameDialogOpen(true);
  };

  useEffect(() => {
    if (!detailsFile) return;
    const updated = filteredFiles.find((f) => f.id === detailsFile.id);
    if (updated) setDetailsFile(updated);
  }, [filteredFiles, detailsFile]);

  const driveFiles = useMemo(
    () => {
      if (!Array.isArray(filteredFiles)) return [];
      return filteredFiles.filter(
        (file) =>
          !file.isDeleted &&
          (file.location?.toLowerCase() === "my drive" || !file.location)
      );
    },
    [filteredFiles]
  );

  // PG-3: select-all checkbox state
  const allVisibleIds = useMemo(() => driveFiles.map(f => f.id), [driveFiles]);
  const selectedCount = useMemo(
    () => driveFiles.reduce((acc, f) => {
      const isFolderItem = isFolder(f);
      const set = isFolderItem ? selectedFolders : selectedFiles;
      return set.has(f.id) ? acc + 1 : acc;
    }, 0),
    [driveFiles, selectedFiles, selectedFolders]
  );
  const allSelected = selectedCount > 0 && selectedCount === driveFiles.length;
  const someSelected = selectedCount > 0 && selectedCount < driveFiles.length;

  const handleHeaderToggle = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(driveFiles);
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

  if (loading) {
    return <Typography sx={{ p: 2 }}>Loading files...</Typography>;
  }

  if (error) {
    return (
      <Typography sx={{ p: 2, color: "#d93025" }}>{error}</Typography>
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
        borderTopLeftRadius: 12,
        color: "#000000ff",
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        My Drive
      </Typography>

      {/* PG-2: conditional toolbar swap */}
      {selectedCount > 0 ? <BatchToolbar visibleItems={driveFiles} /> : <MenuBar />}

      {driveFiles.length === 0 ? (
        <Typography sx={{ p: 4, color: "#5f6368" }}>
          No files match the current filters.
        </Typography>
      ) : (
        <>
          {/* View Mode Buttons */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <IconButton
              onClick={() => setViewMode("list")}
              sx={{ color: viewMode === "list" ? "#1a73e8" : "#5f6368" }}
            >
              <ListIcon />
            </IconButton>

            <IconButton
              onClick={() => setViewMode("grid")}
              sx={{ color: viewMode === "grid" ? "#1a73e8" : "#5f6368" }}
            >
              <GridViewIcon />
            </IconButton>
          </Box>

          {/* LIST VIEW */}
          {viewMode === "list" ? (
            <>
              {/* Header row with select-all checkbox (PG-3) */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 2,
                  py: 1,
                  borderBottom: "1px solid #e0e0e0",
                  color: "#5f6368",
                  fontSize: 14,
                  fontWeight: 500,
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
                <Box sx={{ flex: 3 }}>Name</Box>
                <Box sx={{ flex: 2 }}>Owner</Box>
                <Box sx={{ flex: 2 }}>Location</Box>
                <Box sx={{ flex: 2 }}>Date modified</Box>
                <Box sx={{ width: 40 }} />
              </Box>

              {driveFiles.map((file) => {
                const selected = isItemSelected(file);

                return (
                  <Box
                    key={file.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 2,
                      py: 1.5,
                      borderBottom: "1px solid #f1f3f4",
                      cursor: "pointer",
                      ...getRowStyles(selected),
                    }}
                  >

                    {/* checkbox stays */}
                    <Box sx={{ width: 40, display: "flex", justifyContent: "center" }}>
                      <Checkbox
                        checked={selected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectionFor(file);
                        }}
                      />
                    </Box>

                    {/* FOLDER ROWS — keep your full manual layout */}
                    {file.type === "folder" ? (
                      <>
                        <Box sx={{ flex: 3, display: "flex", gap: 1.5 }}>
                          <FolderIcon sx={{ fontSize: 24, color: "#4285f4" }} />
                          <Typography sx={{ fontWeight: 500 }}>{file.name}</Typography>
                        </Box>

                        <Box sx={{ flex: 2 }}>
                          <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                            {file.owner}
                          </Typography>
                        </Box>

                        <Box sx={{ flex: 2 }}>
                          <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                            {file.location}
                          </Typography>
                        </Box>

                        <Box sx={{ flex: 2 }}>
                          <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                            {formatDate(file.lastAccessedAt)}
                          </Typography>
                        </Box>

                        <IconButton size="small" onClick={(e) => openMenu(e, file)}>
                          <MoreVertIcon sx={{ color: "#5f6368" }} />
                        </IconButton>
                      </>
                    ) : (
                      /* FILE ROWS — use HoverActions */
                      <Box sx={{ flex: 1 }}>
                        <HoverActions
                          file={file}
                          toggleStar={toggleStar}
                          openShareDialog={openShareDialog}
                          openMenu={openMenu}
                          downloadFile={downloadFile}
                          formatDate={formatDate}
                          showRename={true}
                        />
                      </Box>
                    )}
                  </Box>
                );
              })}

            </>
          ) : (
            /* GRID VIEW */
            <Grid container spacing={2}>
              {driveFiles.map((file) => {
                const selected = isItemSelected(file);
                return (
                  <Grid item xs={12} sm={6} md={3} lg={2} key={file.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        cursor: "pointer",
                        transition: "0.2s",
                        position: "relative",
                        ...getCardStyles(selected),
                      }}
                      onClick={() => { /* placeholder for potential open */ }}
                    >
                      {/* PG-6: grid view checkbox overlay */}
                      <Checkbox
                        size="small"
                        checked={selected}
                        onChange={(e) => { e.stopPropagation(); toggleSelectionFor(file); }}
                        sx={checkboxOverlayStyles}
                      />
                      <IconButton
                        size="small"
                        sx={{ position: "absolute", top: 4, right: 4 }}
                        onClick={(e) => openMenu(e, file)}
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
                        }}
                      >
                        {file.type === "folder" ? (
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

                      <Box sx={{ p: 1.5, pt: 5 }}>
                        <Typography sx={{ fontWeight: 500, fontSize: 14, mb: 0.5 }}>
                          {file.name}
                        </Typography>
                        <Typography sx={{ color: "#5f6368", fontSize: 12 }}>
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
        </>
      )}

      {/* FILE KEbab Menu */}
      <FileKebabMenu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={closeMenu}
        selectedFile={selectedFile}
        onStartRename={(file) => {
          setFileToRename(file);
          setRenameDialogOpen(true);
        }}
        onStartShare={(file) => {
          setFileToShare(file);
          setShareDialogOpen(true);
        }}
        onViewDetails={(file) => {
          setDetailsFile(file);
          setDetailsPanelOpen(true);
        }}
      />

      <DetailsPanel
        open={detailsPanelOpen}
        file={detailsFile}
        onClose={() => setDetailsPanelOpen(false)}
        onManageAccess={(file) => {
          setDetailsPanelOpen(false);
          setFileToShare(file);
          setShareDialogOpen(true);
        }}
      />

      {/* Rename Dialog */}
      <RenameDialog
        open={renameDialogOpen}
        file={fileToRename}
        onClose={() => {
          setRenameDialogOpen(false);
          setFileToRename(null);
        }}
        onSubmit={(newName) => {
          renameFile(fileToRename.id, newName);
          setRenameDialogOpen(false);
          setFileToRename(null);
        }}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        file={fileToShare}
        onClose={() => {
          setShareDialogOpen(false);
          setFileToShare(null);
        }}
      />
    </Box>
  );
}

export default MyDrive;

import React, { useMemo, useState } from "react";
import { Box, Typography, IconButton, Tooltip, Divider, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import ShareIcon from "@mui/icons-material/PersonAdd";
import DownloadIcon from "@mui/icons-material/Download";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import { useFiles } from "../context/fileContext";
import BatchMoveDialog from "./BatchMoveDialog";
import BatchShareDialog from "./BatchShareDialog";

const BatchToolbar = ({ toolbarSource, visibleItems = [] }) => {
  const {
    selectedFiles,
    selectedFolders,
    clearSelection,
    batchTrash,
    batchDelete,
    batchStar,
    batchMove,
    batchDownload,
    batchShare,
    batchCopy,
    sourceFilter
  } = useFiles();

  const hasVisibleContext = Array.isArray(visibleItems);

  const { visibleFileIds, visibleFolderIds } = useMemo(() => {
    const fileIds = new Set();
    const folderIds = new Set();
    visibleItems.forEach((item) => {
      if (!item || !item.id) return;
      const isFolderItem = (item.type || "").toLowerCase() === "folder";
      if (isFolderItem) folderIds.add(item.id); else fileIds.add(item.id);
    });
    return { visibleFileIds: fileIds, visibleFolderIds: folderIds };
  }, [visibleItems]);

  const selectedVisibleItems = useMemo(() => {
    const map = new Map();
    visibleItems.forEach((item) => {
      if (item?.id) map.set(item.id, item);
    });
    const fileIds = Array.from(selectedFiles);
    const folderIds = Array.from(selectedFolders);
    return [
      ...fileIds
        .filter((id) => !hasVisibleContext || visibleFileIds.has(id))
        .map((id) => map.get(id))
        .filter(Boolean),
      ...folderIds
        .filter((id) => !hasVisibleContext || visibleFolderIds.has(id))
        .map((id) => map.get(id))
        .filter(Boolean),
    ];
  }, [selectedFiles, selectedFolders, visibleItems, visibleFileIds, visibleFolderIds, hasVisibleContext]);

  const selectedVisibleFiles = useMemo(
    () => Array.from(selectedFiles).filter((id) => !hasVisibleContext || visibleFileIds.has(id)),
    [selectedFiles, visibleFileIds, hasVisibleContext]
  );
  const selectedVisibleFolders = useMemo(
    () => Array.from(selectedFolders).filter((id) => !hasVisibleContext || visibleFolderIds.has(id)),
    [selectedFolders, visibleFolderIds, hasVisibleContext]
  );

  const count = selectedVisibleFiles.length + selectedVisibleFolders.length;
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  if (count === 0) return null;

  const effectiveSource = toolbarSource || sourceFilter;
  const isTrash = effectiveSource === "trash";

  const handleTrash = async () => {
    if (window.confirm(`Move ${count} items to trash?`)) {
      try {
        await batchTrash(selectedVisibleFiles, selectedVisibleFolders, true);
        clearSelection();
      } catch (_) {
        /* keep selection on failure */
      }
    }
  };

  const handleRestore = async () => {
    if (window.confirm(`Restore ${count} items?`)) {
      try {
        await batchTrash(selectedVisibleFiles, selectedVisibleFolders, false);
        clearSelection();
      } catch (_) {
        /* keep selection on failure */
      }
    }
  };

  const handleDeleteForever = async () => {
    if (window.confirm(`Permanently delete ${count} items? This cannot be undone.`)) {
      try {
        await batchDelete(selectedVisibleFiles, selectedVisibleFolders);
        clearSelection();
      } catch (_) {
        /* keep selection on failure */
      }
    }
  };

  const handleStar = async () => {
    const hasUnstarred = selectedVisibleItems.some((item) => !item?.isStarred);
    const nextState = hasUnstarred ? true : false;
    try {
      await batchStar(selectedVisibleFiles, selectedVisibleFolders, nextState);
      clearSelection();
    } catch (_) {
      /* keep selection on failure */
    }
  };

  const handleMoveClick = () => {
    setMoveDialogOpen(true);
  };

  const handleMoveConfirm = async (destinationFolderId) => {
    if (!destinationFolderId) {
      window.alert("Please choose a destination folder.");
      return;
    }
    try {
      await batchMove(selectedVisibleFiles, selectedVisibleFolders, destinationFolderId);
      setMoveDialogOpen(false);
      clearSelection();
    } catch (_) {
      /* keep selection on failure */
    }
  };

  const handleDownload = async () => {
    try {
      await batchDownload(selectedVisibleFiles, selectedVisibleFolders);
      clearSelection();
    } catch (_) {
      /* keep selection on failure */
    }
  };

  const handleShareClick = () => {
    setShareDialogOpen(true);
  };

  const handleShareConfirm = async (userId, permission) => {
    const ok = await batchShare(selectedVisibleFiles, selectedVisibleFolders, userId, permission);
    if (ok) {
      clearSelection();
    }
  };

  const handleCopy = async () => {
    try {
      await batchCopy(selectedVisibleFiles, selectedVisibleFolders);
      clearSelection();
      handleMenuClose();
    } catch (_) {
      /* keep selection on failure */
      handleMenuClose();
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
          backgroundColor: "#e8f0fe", // Light blue background for selection mode
          borderRadius: "16px",
          mx: 2,
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton size="small" onClick={clearSelection}>
            <CloseIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, color: "#1967d2" }}>
            {count} selected
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {!isTrash && (
            <>
              <Tooltip title="Share">
                <IconButton size="small" onClick={handleShareClick}>
                  <ShareIcon fontSize="small" sx={{ color: "#5f6368" }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Download">
                <IconButton size="small" onClick={handleDownload}>
                  <DownloadIcon fontSize="small" sx={{ color: "#5f6368" }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Move">
                <IconButton size="small" onClick={handleMoveClick}>
                  <DriveFileMoveOutlinedIcon fontSize="small" sx={{ color: "#5f6368" }} />
                </IconButton>
              </Tooltip>

              <Tooltip title={selectedVisibleItems.every((item) => item?.isStarred) ? "Remove from starred" : "Add to starred"}>
                <IconButton size="small" onClick={handleStar}>
                  <StarBorderIcon fontSize="small" sx={{ color: "#5f6368" }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Move to trash">
                <IconButton size="small" onClick={handleTrash}>
                  <DeleteOutlineIcon fontSize="small" sx={{ color: "#5f6368" }} />
                </IconButton>
              </Tooltip>
            </>
          )}

          {isTrash && (
            <>
              <Tooltip title="Restore">
                <IconButton size="small" onClick={handleRestore}>
                  <RestoreFromTrashIcon fontSize="small" sx={{ color: "#5f6368" }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete forever">
                <IconButton size="small" onClick={handleDeleteForever}>
                  <DeleteForeverIcon fontSize="small" sx={{ color: "#5f6368" }} />
                </IconButton>
              </Tooltip>
            </>
          )}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 24, alignSelf: "center" }} />

          <Tooltip title="More actions">
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon fontSize="small" sx={{ color: "#5f6368" }} />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            {!isTrash && (
              <MenuItem onClick={handleCopy}>
                <ListItemIcon>
                  <ContentCopyIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Make a copy</ListItemText>
              </MenuItem>
            )}
            {/* Add more menu items here if needed */}
          </Menu>
        </Box>
      </Box>

      <BatchMoveDialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        onMove={handleMoveConfirm}
        selectedCount={count}
      />

      <BatchShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        onShare={handleShareConfirm}
        selectedCount={count}
      />
    </>
  );
};

export default BatchToolbar;

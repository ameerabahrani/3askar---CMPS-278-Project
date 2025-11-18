import { Divider, Menu, MenuItem } from "@mui/material";
import { useFiles } from "../context/fileContext.jsx";

import DownloadIcon from "@mui/icons-material/Download";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
import InfoIcon from "@mui/icons-material/Info";
import DeleteIcon from "@mui/icons-material/Delete";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";

function FileKebabMenu({
  anchorEl,
  anchorPosition,
  open,
  onClose,
  selectedFile,
  onStartRename,
  onStartShare,
  onViewDetails,
}) {
  const { moveToTrash, toggleStar, renameFile, downloadFile, copyFile } =
    useFiles();

  const anchorReference = anchorPosition ? "anchorPosition" : "anchorEl";

  const menuItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    fontSize: "0.95rem",
    "&:hover": { backgroundColor: "#f7f7f7" },
  };

  const iconStyle = { color: "rgba(0,0,0,0.6)" };

  // --- Actions ---
  const handleDownload = () => {
    if (!selectedFile) return;
    downloadFile(selectedFile);
    onClose?.();
  };

  const handleRename = () => {
    if (!selectedFile) return;
    onStartRename?.(selectedFile);
    onClose?.();
  };

  const handleShare = () => {
    if (!selectedFile) return;
    onStartShare?.(selectedFile);
    onClose?.();
  };

  const handleCopy = async () => {
    if (!selectedFile) return;
    try {
      await copyFile(selectedFile);
    } catch (err) {
      console.error("Failed to copy file:", err);
    } finally {
      onClose?.();
    }
  };

  const handleTrash = () => {
    if (!selectedFile) return;
    moveToTrash(selectedFile.id);
    onClose?.();
  };

  const handleStarToggle = () => {
    if (!selectedFile) return;
    toggleStar(selectedFile.id);
    onClose?.();
  };

  const starLabel = selectedFile?.isStarred
    ? "Remove from starred"
    : "Add to starred";

  const StarIconComponent = selectedFile?.isStarred
    ? StarIcon
    : StarBorderIcon;

  return (
    <Menu
      disableAutoFocusItem
      anchorEl={anchorEl}
      anchorReference={anchorReference}
      anchorPosition={anchorPosition}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          minWidth: 220,
          borderRadius: 3,
          border: "1px solid #e0e0e0",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          py: 0.5,
          px: 0.5,
        },
      }}
    >
      <MenuItem
        onClick={handleDownload}
        sx={menuItemStyle}
        disabled={!selectedFile}
      >
        <DownloadIcon fontSize="small" sx={iconStyle} />
        Download
      </MenuItem>

      <MenuItem
        onClick={handleRename}
        sx={menuItemStyle}
        disabled={!selectedFile}
      >
        <DriveFileRenameOutlineIcon fontSize="small" sx={iconStyle} />
        Rename
      </MenuItem>

      <MenuItem
        onClick={handleCopy}
        sx={menuItemStyle}
        disabled={!selectedFile}
      >
        <FileCopyIcon fontSize="small" sx={iconStyle} />
        Make a copy
      </MenuItem>

      <Divider sx={{ my: 0.5 }} />

      <MenuItem onClick={handleShare} sx={menuItemStyle}>
        <PersonAddIcon fontSize="small" sx={iconStyle} />
        Share
      </MenuItem>

      <MenuItem onClick={onClose} sx={menuItemStyle}>
        <DriveFileMoveIcon fontSize="small" sx={iconStyle} />
        Organize
      </MenuItem>

      <MenuItem
        onClick={() => {
          if (onViewDetails && selectedFile) {
            onViewDetails(selectedFile);
          }
          onClose();
        }}
        sx={menuItemStyle}
      >
        <InfoIcon fontSize="small" sx={iconStyle} />
        File information
      </MenuItem>

      <Divider sx={{ my: 0.5 }} />

      <MenuItem
        onClick={handleTrash}
        sx={menuItemStyle}
        disabled={!selectedFile}
      >
        <DeleteIcon fontSize="small" sx={iconStyle} />
        Move to trash
      </MenuItem>

      <MenuItem
        onClick={handleStarToggle}
        sx={menuItemStyle}
        disabled={!selectedFile}
      >
        <StarIconComponent fontSize="small" sx={iconStyle} />
        {starLabel}
      </MenuItem>
    </Menu>
  );
}

export default FileKebabMenu;

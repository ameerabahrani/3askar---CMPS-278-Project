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

  // FILE MODE props
  selectedFile,
  onStartRename,
  onStartShare,
  onViewDetails,
  onActionComplete,

  // FOLDER MODE props
  onRename,
  onTrash,
  onToggleStar,
  onCopy,
  isStarred,
  isInTrash,
  onFolderShare,
  onFolderDetails,
  onDownloadFolder,
}) {
  const { moveToTrash, toggleStar, downloadFile, copyFile } = useFiles();

  const anchorReference = anchorPosition ? "anchorPosition" : "anchorEl";

  // If any of these exist, we’re in "folder mode"
  const isFolderMenu =
    onRename || onTrash || onToggleStar || onCopy;

  const menuItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    fontSize: "0.95rem",
    "&:hover": { backgroundColor: "#f7f7f7" },
  };

  const iconStyle = { color: "rgba(0,0,0,0.6)" };

  // -------------------- ACTIONS --------------------

  const handleDownload = () => {
    if (isFolderMenu) {
      onDownloadFolder?.();
    } else if (selectedFile) {
      downloadFile(selectedFile);
    }
    onClose?.();
  };


  const handleRename = () => {
    if (isFolderMenu) {
      onRename?.();
    } else {
      onStartRename?.(selectedFile);
    }
    onClose?.();
  };

  const handleCopy = async () => {
    if (isFolderMenu) {
      await onCopy?.();
    } else if (selectedFile) {
      await copyFile(selectedFile);
    }
    onClose?.();
    onClose?.();
  };

  const handleTrash = () => {
    if (isFolderMenu) {
      onTrash?.();
    } else if (selectedFile) {
      moveToTrash(selectedFile.id);
    }
    onClose?.();
  };

  const handleStarToggle = () => {
    if (isFolderMenu) {
      onToggleStar?.();
    } else if (selectedFile) {
      toggleStar(selectedFile.id);
    }
    onClose?.();
  };

  const handleShare = () => {
    if (isFolderMenu) {
      onFolderShare?.();
    } else {
      onStartShare?.(selectedFile);
    }
    onClose?.();
  };

  const handleInfo = () => {
    if (isFolderMenu) {
      onFolderDetails?.();
    } else if (onViewDetails && selectedFile) {
      onViewDetails(selectedFile);
    }
    onClose?.();
  };

  // -------------------- LABELS --------------------

  const effectiveIsStarred = isFolderMenu
    ? isStarred
    : selectedFile?.isStarred;

  const StarComponent = effectiveIsStarred ? StarIcon : StarBorderIcon;
  const starLabel = effectiveIsStarred
    ? "Remove from starred"
    : "Add to starred";

  const trashLabel =
    isFolderMenu && isInTrash
      ? "Restore from trash"
      : "Move to trash";

  // -------------------- RENDER --------------------

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
        },
      }}
    >
      {/* Download (files only) */}
      <MenuItem onClick={handleDownload} sx={menuItemStyle}>
        <DownloadIcon fontSize="small" sx={iconStyle} />
        Download
      </MenuItem>

      {/* Rename */}
      <MenuItem onClick={handleRename} sx={menuItemStyle}>
        <DriveFileRenameOutlineIcon fontSize="small" sx={iconStyle} />
        Rename
      </MenuItem>

      {/* Make a copy */}
      <MenuItem onClick={handleCopy} sx={menuItemStyle}>
        <FileCopyIcon fontSize="small" sx={iconStyle} />
        Make a copy
      </MenuItem>

      <Divider sx={{ my: 0.5 }} />

      {/* Share – works for files AND folders now */}
      <MenuItem onClick={handleShare} sx={menuItemStyle}>
        <PersonAddIcon fontSize="small" sx={iconStyle} />
        Share
      </MenuItem>

      {/* Organize (same as before, just closes menu for now) */}
      <MenuItem onClick={onClose} sx={menuItemStyle}>
        <DriveFileMoveIcon fontSize="small" sx={iconStyle} />
        Organize
      </MenuItem>

      {/* Info – File information / Folder information */}
      <MenuItem onClick={handleInfo} sx={menuItemStyle}>
        <InfoIcon fontSize="small" sx={iconStyle} />
        {isFolderMenu ? "Folder information" : "File information"}
      </MenuItem>

      <Divider sx={{ my: 0.5 }} />

      {/* Trash / Restore */}
      <MenuItem onClick={handleTrash} sx={menuItemStyle}>
        <DeleteIcon fontSize="small" sx={iconStyle} />
        {trashLabel}
      </MenuItem>

      {/* Star / Unstar */}
      <MenuItem onClick={handleStarToggle} sx={menuItemStyle}>
        <StarComponent fontSize="small" sx={iconStyle} />
        {starLabel}
      </MenuItem>
    </Menu>
  );
}

export default FileKebabMenu;

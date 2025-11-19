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

  // ORIGINAL props (for files)
  selectedFile,
  onStartRename,
  onStartShare,
  onViewDetails,

  // NEW optional folder props:
  onRename,
  onTrash,
  onToggleStar,
  onCopy,
  isStarred,
  isInTrash,
}) {
  // File actions (still needed for file mode)
  const { moveToTrash, toggleStar, renameFile, downloadFile, copyFile } =
    useFiles();

  const anchorReference = anchorPosition ? "anchorPosition" : "anchorEl";

  // Detect whether menu is being used for folders
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

  // ---- ACTIONS ----

  const handleDownload = () => {
    if (isFolderMenu) {
      onClose?.();
      return;
    }
    downloadFile(selectedFile);
    onClose?.();
  };

  const handleRename = () => {
    if (isFolderMenu) {
      onRename?.();
      onClose?.();
      return;
    }
    onStartRename?.(selectedFile);
    onClose?.();
  };

  const handleCopy = async () => {
    if (isFolderMenu) {
      await onCopy?.();
      onClose?.();
      return;
    }
    await copyFile(selectedFile);
    onClose?.();
  };

  const handleTrash = () => {
    if (isFolderMenu) {
      onTrash?.();
      onClose?.();
      return;
    }
    moveToTrash(selectedFile.id);
    onClose?.();
  };

  const handleStarToggle = () => {
    if (isFolderMenu) {
      onToggleStar?.();
      onClose?.();
      return;
    }
    toggleStar(selectedFile.id);
    onClose?.();
  };

  const effectiveIsStarred = isFolderMenu
    ? isStarred
    : selectedFile?.isStarred;

  const StarComponent = effectiveIsStarred ? StarIcon : StarBorderIcon;
  const starLabel = effectiveIsStarred
    ? "Remove from starred"
    : "Add to starred";

  const trashLabel =
    isFolderMenu && isInTrash ? "Restore from trash" : "Move to trash";

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
      <MenuItem
        onClick={handleDownload}
        sx={menuItemStyle}
      >
        <DownloadIcon fontSize="small" sx={iconStyle} />
        Download
      </MenuItem>

      <MenuItem
        onClick={handleRename}
        sx={menuItemStyle}
      >
        <DriveFileRenameOutlineIcon fontSize="small" sx={iconStyle} />
        Rename
      </MenuItem>

      <MenuItem
        onClick={handleCopy}
        sx={menuItemStyle}
      >
        <FileCopyIcon fontSize="small" sx={iconStyle} />
        Make a copy
      </MenuItem>

      <Divider sx={{ my: 0.5 }} />

      <MenuItem
        onClick={handleTrash}
        sx={menuItemStyle}
      >
        <DeleteIcon fontSize="small" sx={iconStyle} />
        {trashLabel}
      </MenuItem>

      <MenuItem
        onClick={handleStarToggle}
        sx={menuItemStyle}
      >
        <StarComponent fontSize="small" sx={iconStyle} />
        {starLabel}
      </MenuItem>
    </Menu>
  );
}

export default FileKebabMenu;

import { Divider, Menu, MenuItem } from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
import InfoIcon from "@mui/icons-material/Info";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import DeleteIcon from "@mui/icons-material/Delete";
import StarBorderIcon from "@mui/icons-material/StarBorder";

function FileKebabMenu({ anchorEl, anchorPosition, open, onClose }) {
  const anchorReference = anchorPosition ? "anchorPosition" : "anchorEl";

  // Shared styling for all menu items
  const menuItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    fontSize: "0.95rem",
    "&:hover": {
      backgroundColor: "#f7f7f7",
    },
  };

  // Muted icon style (Google Drive-like)
  const iconStyle = { color: "rgba(0,0,0,0.6)" };

  return (
    <Menu
      anchorEl={anchorEl}
      anchorReference={anchorReference}
      anchorPosition={anchorPosition}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          minWidth: 220,
          borderRadius: 3,
          boxShadow: 3,
          py: 0.5,
          px: 0.5,
        },
      }}
    >
      {/* Download */}
      <MenuItem onClick={onClose} sx={menuItemStyle}>
        <DownloadIcon fontSize="small" sx={iconStyle} />
        Download
      </MenuItem>

      {/* Rename */}
      <MenuItem onClick={onClose} sx={menuItemStyle}>
        <DriveFileRenameOutlineIcon fontSize="small" sx={iconStyle} />
        Rename
      </MenuItem>

      {/* Make a copy */}
      <MenuItem onClick={onClose} sx={menuItemStyle}>
        <FileCopyIcon fontSize="small" sx={iconStyle} />
        Make a copy
      </MenuItem>

      <Divider sx={{ my: 0.5 }} />

      {/* Share */}
      <MenuItem onClick={onClose} sx={menuItemStyle}>
        <PersonAddIcon fontSize="small" sx={iconStyle} />
        Share
      </MenuItem>

      {/* Organize (Move...) */}
      <MenuItem onClick={onClose} sx={menuItemStyle}>
        <DriveFileMoveIcon fontSize="small" sx={iconStyle} />
        Organize
      </MenuItem>

      {/* File info */}
      <MenuItem onClick={onClose} sx={menuItemStyle}>
        <InfoIcon fontSize="small" sx={iconStyle} />
        File information
      </MenuItem>

      <Divider sx={{ my: 0.5 }} />

      {/* Move to trash */}
      <MenuItem onClick={onClose} sx={menuItemStyle}>
        <DeleteIcon fontSize="small" sx={iconStyle} />
        Move to trash
      </MenuItem>

      {/* Star / Unstar (placeholder for now) */}
      <MenuItem onClick={onClose} sx={menuItemStyle}>
        <StarBorderIcon fontSize="small" sx={iconStyle} />
        Add to starred
      </MenuItem>
    </Menu>
  );
}

export default FileKebabMenu;

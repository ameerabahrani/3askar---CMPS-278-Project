import React, { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";

const DEFAULT_FILE_ICON =
  "https://www.gstatic.com/images/icons/material/system/2x/insert_drive_file_black_24dp.png";

function HoverActions({
  file,
  toggleStar,
  openShareDialog,
  openRenameDialog,
  openMenu,
  downloadFile,
  formatDate,
  renderContent,
  onContextMenu,
  showShare = true,
  showDownload = true,
  showRename = true,
  showStar = true,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={(event) => {
        if (!onContextMenu) return;
        onContextMenu(event, file);
      }}
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        px: 2,
        py: 1.5,
        borderBottom: "1px solid #f1f3f4",
        cursor: "pointer",
        "&:hover": { backgroundColor: "#f8f9fa" },
      }}
    >
      {/* === QUICK ACTIONS (only when hovered) === */}
      {hovered && (
        <Box
          sx={{
            position: "absolute",
            right: 50, // appears before it's past kebab menu
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: "#f1f3f4",
            padding: "4px 6px",
            borderRadius: "6px",
            zIndex: 3,
          }}
        >
          {showShare && (
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                openShareDialog?.(file);
              }}
            >
              <PersonAddAltIcon sx={{ fontSize: 18, color: "#5f6368" }} />
            </IconButton>
          )}

          {showDownload && (
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                downloadFile?.(file);
              }}
            >
              <DownloadIcon sx={{ fontSize: 18, color: "#5f6368" }} />
            </IconButton>
          )}

          {showRename && (
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                openRenameDialog?.(file);
              }}
            >
              <EditIcon sx={{ fontSize: 18, color: "#5f6368" }} />
            </IconButton>
          )}

          {showStar && (
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                toggleStar?.(file.id);
              }}
            >
              {file.isStarred ? (
                <StarIcon sx={{ fontSize: 18, color: "#f7cb4d" }} />
              ) : (
                <StarBorderIcon sx={{ fontSize: 18, color: "#5f6368" }} />
              )}
            </IconButton>
          )}
        </Box>
      )}

      {/*FILE ROW CONTENT*/}

      {renderContent ? (
        renderContent(file)
      ) : (
        <>
          <Box
            sx={{
              flex: 3,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {file.type === "folder" ? (
              <FolderIcon sx={{ fontSize: 24, color: "#4285f4" }} />
            ) : (
              <img
                src={file.icon || DEFAULT_FILE_ICON}
                width={20}
                height={20}
                alt="file type"
              />
            )}

            <Typography sx={{ fontWeight: 500 }}>{file.name}</Typography>
          </Box>

          <Box sx={{ flex: 2 }}>
            <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
              {file.owner || "Unknown"}
            </Typography>
          </Box>

          <Box sx={{ flex: 2 }}>
            <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
              {file.location || "My Drive"}
            </Typography>
          </Box>

          <Box sx={{ flex: 2 }}>
            <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
              {formatDate(file.lastAccessedAt || file.uploadedAt)}
            </Typography>
          </Box>
        </>
      )}

      {/* === YOUR EXISTING KEBAB MENU (unchanged) === */}
      <Box
        sx={{
          width: 40,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            openMenu?.(event, file);
          }}
        >
          <MoreVertIcon sx={{ color: "#5f6368" }} />
        </IconButton>
      </Box>
    </Box>
  );
}

export default HoverActions;

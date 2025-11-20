import React, { useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  TextField,
  Tabs,
  Tab,
  IconButton,
  useMediaQuery,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import FolderIcon from "@mui/icons-material/Folder";
import { updateFolder } from "../api/foldersApi";


function formatDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function FolderDetailsPanel({ open, folder, onClose, onDescriptionUpdated }) {
  if (!folder) return null;

  const [tab, setTab] = useState(0); // 0 = Details, 1 = Activity (placeholder)
  const [description, setDescription] = useState(folder.description || "");

 
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSaveDescription = async () => {
    if (!folder) return;

    try {
      setSaving(true);
      setSaveError(null);

      const updated = await updateFolder(folder.publicId || folder._id, {
        description: description,
      });

      onDescriptionUpdated?.(updated);
    } catch (err) {
      console.error("Failed to update folder description", err);
      setSaveError(err.message || "Failed to save");
      alert(err.message || "Failed to save description");
    } finally {
      setSaving(false);
    }
  };
  

  const isMobile = useMediaQuery("(max-width: 600px)");
  const drawerWidth = isMobile ? "100vw" : 360;

  return (
    <Drawer
      anchor="right"
      open={open}
      variant="persistent"
      hideBackdrop
      transitionDuration={250}
      PaperProps={{
        sx: {
          width: drawerWidth,
          p: 0,
          mt: 0.5,
          boxSizing: "border-box",
          position: "fixed",
          top: "64px !important",
          height: "calc(100vh - 64px)",
          borderRadius: "16px 0 0 16px",
          overflow: "hidden",
          border: "none",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
        },
      }}
    >
      {/* ---------- HEADER ---------- */}
      <Box sx={{ display: "flex", alignItems: "center", p: 2 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            backgroundColor: "#e8f0fe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 1.5,
          }}
        >
          <FolderIcon sx={{ color: "#1a73e8" }} />
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              wordBreak: "break-word",
              whiteSpace: "normal",
              lineHeight: 1.2,
            }}
          >
            {folder.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#5f6368", display: "flex", alignItems: "center", mt: 0.5 }}
          >
            <StarIcon
              fontSize="small"
              sx={{
                mr: 0.5,
                color: folder.isStarred ? "#fbbc04" : "#dadce0",
              }}
            />
            {folder.isStarred ? "Starred" : "Not starred"}
          </Typography>
        </Box>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* ---------- TABS ---------- */}
      <Tabs
        value={tab}
        onChange={(e, value) => setTab(value)}
        centered
        disableRipple
        TabIndicatorProps={{
          sx: {
            backgroundColor: "#1a73e8",
            height: 2,
            borderRadius: 1,
            transition: "all 0.25s ease",
          },
        }}
        sx={{
          px: 2,
          borderBottom: "1px solid #e0e0e0",
          "& .MuiTab-root": {
            textTransform: "none",
            minWidth: "auto",
            mx: 3,
            fontWeight: 500,
            fontSize: "15px",
            color: "#5f6368",
          },
          "& .Mui-selected": {
            color: "#1a73e8",
          },
        }}
      >
        <Tab label="Details" />
        <Tab label="Activity" />
      </Tabs>

      {/* ---------- CONTENT ---------- */}
      <Box sx={{ p: 2, overflowY: "auto", flexGrow: 1 }}>
        {tab === 0 && (
          <>
            <Typography sx={{ fontWeight: "bold" }}>Location</Typography>
            <Typography sx={{ mb: 2 }}>
              {folder.location === "TRASH"
                ? "Trash"
                : folder.location === "SHARED"
                ? "Shared with me"
                : "My Drive"}
            </Typography>

            <Typography sx={{ fontWeight: "bold" }}>Path</Typography>
            <Typography sx={{ mb: 2 }}>
              {folder.path || "/My Drive"}
            </Typography>

            <Typography sx={{ fontWeight: "bold" }}>Description</Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description"
              sx={{ mb: 1 }}
            />
            <Box
              sx={{
                backgroundColor: "#e8f0fe",
                color: "#1a73e8",
                px: 2,
                py: 1,
                width: "fit-content",
                borderRadius: 2,
                fontWeight: 600,
                cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
              onClick={saving ? undefined : handleSaveDescription}
            >
              {saving ? "Saving..." : "Save"}
            </Box>

            {saveError && (
              <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                {saveError}
              </Typography>
            )}


            <Typography sx={{ fontWeight: "bold" }}>Created</Typography>
            <Typography sx={{ mb: 2 }}>
              {formatDate(folder.createdAt)}
            </Typography>

            <Typography sx={{ fontWeight: "bold" }}>Last modified</Typography>
            <Typography sx={{ mb: 2 }}>
              {formatDate(folder.updatedAt)}
            </Typography>
          </>
        )}

        {tab === 1 && (
          <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
            Folder activity will appear here once backend tracking is added.
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}

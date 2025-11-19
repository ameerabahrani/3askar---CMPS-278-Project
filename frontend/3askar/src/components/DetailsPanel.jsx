import React, { useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  TextField,
  IconButton,
  Tabs,
  Tab,
  useMediaQuery
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadIcon from "@mui/icons-material/Upload";
import EditIcon from "@mui/icons-material/Edit";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import { API_BASE_URL } from "../services/apiClient";
import { useFiles } from "../context/fileContext";
import { useEffect } from "react";

// --- HELPERS FOR FORMATTING ---
const formatSize = (bytes) => {
  if (bytes === 0 || bytes === undefined) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 10 ? 0 : 1)} ${sizes[i]}`;
};

const formatDate = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const formatType = (file) => {
  if (!file) return "";

  const mime = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  const ext = name.split(".").pop();

  if ((file.type || "").toLowerCase() === "folder") return "Folder";

  if (mime.includes("pdf") || ext === "pdf") return "PDF document";

  if (
    mime.includes("word") ||
    mime.includes("wordprocessing") ||
    ["doc", "docx"].includes(ext)
  ) {
    return "Word document";
  }

  if (
    mime.includes("presentation") ||
    ["ppt", "pptx"].includes(ext)
  ) {
    return "Presentation";
  }

  if (
    mime.includes("spreadsheet") ||
    ["xls", "xlsx", "csv"].includes(ext)
  ) {
    return "Spreadsheet";
  }

  if (mime.startsWith("image/")) return "Image";
  if (mime.startsWith("video/")) return "Video";
  if (mime.startsWith("audio/")) return "Audio";

  return mime || "Unknown type";
};





export default function DetailsPanel({ open, file, onClose, onManageAccess }) {
  if (!file) return null;

  const [tab, setTab] = useState(0); // 0 = Details, 1 = Activity
  const [description, setDescription] = useState(file.description || "");
  const { refreshFiles } = useFiles();

  useEffect(() => {
  setDescription(file.description || "");
  }, [file]);



  const isMobile = useMediaQuery("(max-width: 600px)");
  const drawerWidth = isMobile ? "100vw" : 360;

  // activity data temp until backend is ready
  const activityData = [
    {
      group: "Today",
      events: [
        { type: "Viewed", time: "6 minutes ago", icon: <VisibilityIcon fontSize="small" /> },
        { type: "Edited", time: "1 hour ago", icon: <EditIcon fontSize="small" /> },
      ],
    },
    {
      group: "Yesterday",
      events: [
        { type: "Uploaded", time: "7:35 PM", icon: <UploadIcon fontSize="small" /> },
      ],
    },
    {
      group: "Nov 19, 2025",
      events: [
        { type: "Renamed", time: "10:12 AM", icon: <HistoryEduIcon fontSize="small" /> },
        { type: "Moved", time: "8:43 AM", icon: <DriveFileMoveIcon fontSize="small" /> },
      ],
    },
  ];

  // access data temp until backend is ready
  const accessList = [
    {
      name: file.owner,
      role: "Owner",
      picture: file.ownerPicture || null,
    },
    ...file.sharedWith.map((entry) => ({
      name: entry.name,
      role: entry.permission === "write" ? "Editor" : "Viewer",
      picture: entry.picture,
    })),
];

  // --- FILE ICON LOOKUP ---
  const getFileIcon = (file) => {
    if (file.icon) return file.icon;

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "pdf") return "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_pdf_x16.png";
    if (["doc", "docx"].includes(ext))
      return "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_word_x16.png";
    if (["xls", "xlsx"].includes(ext))
      return "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_excel_x16.png";
    if (["ppt", "pptx"].includes(ext))
      return "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_ppt_x16.png";

    return "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_generic_x16.png";
  };

  const getInitial = (name) => {


  return name?.charAt(0)?.toUpperCase() || "?";
  };

  
  const handleSaveDescription = async () => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/files/${file.id}/description`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ description }),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to update description");
    }

    const data = await res.json();

    // update UI inside the panel
    setDescription(data.file.description);

    // refresh global file list
    refreshFiles();

  } catch (err) {
    console.error(err);
    alert("Unable to save description.");
  }
};


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
          transition: "transform 0.25s cubic-bezier(.4,0,.2,1)",
          transform: open ? "translateX(0)" : "translateX(100%)",

        }
      }}
    >

      {/* ---------- HEADER ---------- */}
      <Box sx={{ display: "flex", alignItems: "center", p: 2 }}>
        <img
          src={getFileIcon(file)}
          alt="file icon"
          style={{
            width: 32,
            height: 32,
            objectFit: "contain",
            marginRight: 12,
          }}
        />

        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            flexGrow: 1,
            wordBreak: "break-word",
            whiteSpace: "normal",
            lineHeight: 1.2,
          }}
        >
          {file.name}
        </Typography>

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
          }
        }}
      >
        <Tab label="Details" />
        <Tab label="Activity" />
      </Tabs>

      {/* ---------- CONTENT ---------- */}
      <Box sx={{ p: 2, overflowY: "auto", flexGrow: 1 }}>

        {/* ===== DETAILS TAB ===== */}
        {tab === 0 && (
          <>
            <Typography sx={{ fontWeight: "bold" }}>Type</Typography>
            <Typography sx={{ mb: 2 }}>{formatType(file)}</Typography>

            <Typography sx={{ fontWeight: "bold" }}>Size</Typography>
            <Typography sx={{ mb: 2 }}>{formatSize(file.size)}</Typography>

            <Typography sx={{ fontWeight: "bold" }}>Location</Typography>
            <Typography sx={{ mb: 2 }}>{file.location}</Typography>

            <Typography sx={{ fontWeight: "bold" }}>Owner</Typography>
            <Typography sx={{ mb: 2 }}>{file.owner}</Typography>

            <Typography sx={{ fontWeight: "bold" }}>Upload Date</Typography>
            <Typography sx={{ mb: 2 }}>{formatDate(file.uploadedAt)}</Typography>

            {/* ACCESS SECTION */}
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                Who has access
              </Typography>

              {/* Users list */}
              {accessList.map((user, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1,
                    borderRadius: 2,
                    "&:hover": { backgroundColor: "#f8f9fa" },
                  }}
                >
                  {/* Left: avatar + name */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: "#e8f0fe",
                        color: "#1a73e8",
                        fontWeight: 600,
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {getInitial(user.name)}
                    </Box>

                    <Typography sx={{ fontSize: 15, color: "#202124" }}>
                      {user.name}
                    </Typography>
                  </Box>

                  {/* Right: role */}
                  <Typography sx={{ color: "#5f6368", fontSize: 13 }}>
                    {user.role}
                  </Typography>
                </Box>
              ))}

              {/* Manage access button */}
              <Box
                sx={{
                  mt: 2,
                  px: 2,
                  py: 1,
                  width: "fit-content",
                  fontWeight: 600,
                  borderRadius: 2,
                  color: "#1a73e8",
                  backgroundColor: "#e8f0fe",
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "#dbe8fc" },
                }}
                onClick={() =>onManageAccess(file)}
              >
                Manage access
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography sx={{ fontWeight: "bold", mb: 1 }}>Description</Typography>

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
                cursor: "pointer",
              }}
              onClick={handleSaveDescription}
            >
              Save
            </Box>
          </>
        )}

        {/* ===== ACTIVITY TAB ===== */}
        {tab === 1 && (
          <Box sx={{ mt: 2 }}>

            {activityData.map((group, groupIndex) => (
              <Box key={groupIndex} sx={{ mb: 3 }}>

                {/* Group title */}
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: "#202124",
                    fontSize: 14,
                    mb: 1,
                  }}
                >
                  {group.group}
                </Typography>

                {/* Events inside group */}
                {group.events.map((event, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      position: "relative",
                      py: 1.5,
                      pl: 1,
                      borderRadius: 2,
                      "&:hover": {
                        backgroundColor: "#f8f9fa",
                      },
                    }}
                  >

                    {/* Vertical connecting line */}
                    {(groupIndex !== activityData.length - 1 ||
                      index !== group.events.length - 1) && (
                      <Box
                        sx={{
                          position: "absolute",
                          left: 16,
                          top: 42,
                          height: "calc(100% - 32px)",
                          width: 2,
                          backgroundColor: "#e0e0e0",
                          zIndex: 0,
                        }}
                      />
                    )}

                    {/* Icon circle */}
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        backgroundColor: "#e8f0fe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        zIndex: 1,
                        color: "#1a73e8",
                      }}
                    >
                      {event.icon}
                    </Box>

                    {/* Text */}
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: "#202124", fontSize: 14 }}>
                        {event.type}
                      </Typography>
                      <Typography sx={{ color: "#5f6368", fontSize: 13, mt: 0.5 }}>
                        {event.time}
                      </Typography>
                    </Box>

                  </Box>
                ))}

              </Box>
            ))}

          </Box>
        )}
      </Box>
    </Drawer>
  );
}

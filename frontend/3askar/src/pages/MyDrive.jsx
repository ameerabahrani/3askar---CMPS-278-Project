import React from "react";
import { Box, Typography, IconButton, Grid, Paper } from "@mui/material";
import MenuBar from "../components/MenuBar";
import FolderIcon from "@mui/icons-material/Folder";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import StarIcon from "@mui/icons-material/Star";
import { useFiles } from "../context/fileContext.jsx";

const DEFAULT_FILE_ICON =
  "https://www.gstatic.com/images/icons/material/system/2x/insert_drive_file_black_24dp.png";

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
};

function MyDrive() {
  const { files, loading, error, toggleStar } = useFiles();
  const [viewMode, setViewMode] = React.useState("list");

  const driveFiles = React.useMemo(
    () =>
      files.filter(
        (file) =>
          !file.isDeleted && (file.location?.toLowerCase() === "my drive" || !file.location)
      ),
    [files]
  );

  if (loading) {
    return <Typography sx={{ p: 2 }}>Loading files...</Typography>;
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

      <MenuBar />

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

      {viewMode === "list" ? (
        <>
          <Box
            sx={{
              display: "flex",
              px: 2,
              py: 1,
              borderBottom: "1px solid #e0e0e0",
              color: "#5f6368",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <Box sx={{ flex: 3 }}>Name</Box>
            <Box sx={{ flex: 2 }}>Owner</Box>
            <Box sx={{ flex: 2 }}>Location</Box>
            <Box sx={{ flex: 2 }}>Date modified</Box>
            <Box sx={{ width: 40 }} />
          </Box>

          {driveFiles.map((file) => (
            <Box
              key={file.id}
              sx={{
                display: "flex",
                alignItems: "center",
                px: 2,
                py: 1.5,
                borderBottom: "1px solid #f1f3f4",
                cursor: "pointer",
                "&:hover": { backgroundColor: "#f8f9fa" },
              }}
            >
              <Box sx={{ flex: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
                <IconButton onClick={() => toggleStar(file.id)} size="small">
                  <StarIcon
                    sx={{
                      color: file.isStarred ? "#f7cb4d" : "#c6c6c6",
                      fontSize: 22,
                    }}
                  />
                </IconButton>
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

              <Box sx={{ width: 40, display: "flex", justifyContent: "flex-end" }}>
                <IconButton size="small">
                  <MoreVertIcon sx={{ color: "#5f6368" }} />
                </IconButton>
              </Box>
            </Box>
          ))}
        </>
      ) : (
        <Grid container spacing={2}>
          {driveFiles.map((file) => (
            <Grid item xs={12} sm={6} md={3} lg={2} key={file.id}>
              <Paper
                elevation={0}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "0.2s",
                  position: "relative",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4 }}>
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

                <Box sx={{ p: 1.5 }}>
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
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default MyDrive;

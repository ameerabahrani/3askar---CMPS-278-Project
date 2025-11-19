import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Grid,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import ListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import StarIcon from "@mui/icons-material/Star";
import FolderIcon from "@mui/icons-material/Folder";
import FileKebabMenu from "../components/FileKebabMenu";
import RenameDialog from "../components/RenameDialog";
import ShareDialog from "../components/ShareDialog";
import DetailsPanel from "../components/DetailsPanel";
import { useFiles } from "../context/fileContext.jsx";
import { searchFiles } from "../services/api/files";

const DEFAULT_FILE_ICON =
  "https://www.gstatic.com/images/icons/material/system/2x/insert_drive_file_black_24dp.png";

const iconMap = [
  {
    matcher: (ext, mime) => mime?.includes("pdf") || ext === "pdf",
    icon: "https://www.gstatic.com/images/icons/material/system/2x/picture_as_pdf_black_24dp.png",
  },
  {
    matcher: (ext, mime) =>
      mime?.startsWith("image/") ||
      ["png", "jpg", "jpeg", "gif", "bmp"].includes(ext),
    icon: "https://www.gstatic.com/images/icons/material/system/2x/image_black_24dp.png",
  },
  {
    matcher: (ext, mime) =>
      mime?.includes("presentation") || ["ppt", "pptx"].includes(ext),
    icon: "https://www.gstatic.com/images/icons/material/system/2x/slideshow_black_24dp.png",
  },
  {
    matcher: (ext, mime) =>
      mime?.includes("spreadsheet") || ["xls", "xlsx", "csv"].includes(ext),
    icon: "https://www.gstatic.com/images/icons/material/system/2x/grid_on_black_24dp.png",
  },
  {
    matcher: (ext, mime) =>
      mime?.includes("wordprocessingml") || ["doc", "docx"].includes(ext),
    icon: "https://www.gstatic.com/images/icons/material/system/2x/description_black_24dp.png",
  },
];

const resolveIcon = (filename = "", mime = "") => {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const match = iconMap.find(({ matcher }) => matcher(ext, mime));
  return match?.icon ?? DEFAULT_FILE_ICON;
};

const normalizeFile = (file) => {
  if (!file) return null;

  const ownerObject =
    typeof file.owner === "object" && file.owner !== null ? file.owner : null;

  return {
    id: file._id?.toString() ?? file.id,
    gridFsId: file.gridFsId,
    name: file.filename || file.originalName || "Untitled",
    owner: ownerObject?.name || ownerObject?.email || "Me",
    ownerId: ownerObject?._id ?? file.owner ?? null,
    ownerEmail: ownerObject?.email,
    location: file.location || "My Drive",
    uploadedAt: file.uploadDate,
    lastAccessedAt: file.lastAccessed || file.lastAccessedAt,
    isStarred: Boolean(file.isStarred),
    isDeleted: Boolean(file.isDeleted),
    sharedWith: Array.isArray(file.sharedWith)
      ? file.sharedWith.map((entry) => ({
          userId: entry.user?._id || entry.user,
          name: entry.user?.name || null,
          email: entry.user?.email || null,
          picture: entry.user?.picture || null,
          permission: entry.permission,
        }))
      : [],
    size: file.size,
    type: file.type,
    description: file.description || "",
    path: Array.isArray(file.path) ? file.path : [],
    icon: resolveIcon(file.filename || file.originalName, file.type),
  };
};

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString();
};

function SearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryKey = searchParams.toString();

  const { renameFile, refreshFiles, toggleStar } = useFiles();

  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [viewMode, setViewMode] = React.useState("list");

  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [selectedFile, setSelectedFile] = React.useState(null);

  const [detailsPanelOpen, setDetailsPanelOpen] = React.useState(false);
  const [detailsFile, setDetailsFile] = React.useState(null);

  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [fileToRename, setFileToRename] = React.useState(null);

  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [fileToShare, setFileToShare] = React.useState(null);

  const buildParams = React.useCallback(() => {
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [queryKey]);

  const loadResults = React.useCallback(
    async (options = {}) => {
      const silent = options.silent === true;
      if (!silent) setLoading(true);
      setError(null);

      try {
        const { data } = await searchFiles(buildParams());
        const normalized = (data || []).map(normalizeFile).filter(Boolean);
        setResults(normalized);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to search files right now."
        );
        setResults([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [buildParams]
  );

  React.useEffect(() => {
    loadResults();
  }, [loadResults]);

  React.useEffect(() => {
    if (!detailsFile) return;
    const updated = results.find((f) => f.id === detailsFile.id);
    if (updated) setDetailsFile(updated);
  }, [results, detailsFile]);

  const openMenu = (event, file) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedFile(file);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
    setSelectedFile(null);
  };

  const handleFileClick = (file) => {
    if (!file) return;
    if ((file.type || "").toLowerCase() === "folder") {
      navigate(`/folders/${file.id}`);
      return;
    }
    setDetailsFile(file);
    setDetailsPanelOpen(true);
  };

  const handleStarClick = async (event, file) => {
    event.stopPropagation();
    await toggleStar(file.id);
    refreshFiles();
    loadResults({ silent: true });
  };

  const handleRenameSubmit = async (newName) => {
    if (!fileToRename) return;
    await renameFile(fileToRename.id, newName);
    setRenameDialogOpen(false);
    setFileToRename(null);
    await loadResults({ silent: true });
    refreshFiles();
  };

  const handleActionComplete = (action) => {
    if (action === "download") return;
    refreshFiles();
    loadResults({ silent: true });
  };

  const primaryQuery =
    searchParams.get("q") ||
    searchParams.get("itemName") ||
    searchParams.get("includesWords");

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
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
        Search Results
      </Typography>
      {primaryQuery && (
        <Typography sx={{ color: "#5f6368", mb: 2 }}>
          Showing matches for "{primaryQuery}"
        </Typography>
      )}

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

      {loading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2 }}>
          <CircularProgress size={20} />
          <Typography>Searching files...</Typography>
        </Box>
      ) : error ? (
        <Typography sx={{ p: 2, color: "#d93025" }}>{error}</Typography>
      ) : results.length === 0 ? (
        <Typography sx={{ p: 4, color: "#5f6368" }}>
          No matching files.
        </Typography>
      ) : viewMode === "list" ? (
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

          {results.map((file) => (
            <Box
              key={file.id}
              onClick={() => handleFileClick(file)}
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
              <Box
                sx={{
                  flex: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <IconButton
                  onClick={(e) => handleStarClick(e, file)}
                  size="small"
                >
                  <StarIcon
                    sx={{
                      color: file.isStarred ? "#f7cb4d" : "#c6c6c6",
                      fontSize: 22,
                    }}
                  />
                </IconButton>

                {(file.type || "").toLowerCase() === "folder" ? (
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

              <Box
                sx={{
                  width: 40,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => openMenu(e, file)}
                >
                  <MoreVertIcon sx={{ color: "#5f6368" }} />
                </IconButton>
              </Box>
            </Box>
          ))}
        </>
      ) : (
        <Grid container spacing={2}>
          {results.map((file) => (
            <Grid item xs={12} sm={6} md={3} lg={2} key={file.id}>
              <Paper
                elevation={0}
                onClick={() => handleFileClick(file)}
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
                  {(file.type || "").toLowerCase() === "folder" ? (
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
        onActionComplete={handleActionComplete}
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

      <RenameDialog
        open={renameDialogOpen}
        file={fileToRename}
        onClose={() => {
          setRenameDialogOpen(false);
          setFileToRename(null);
        }}
        onSubmit={handleRenameSubmit}
      />

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

export default SearchResults;

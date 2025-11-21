import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from "@mui/material";
import { Grid, Paper } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import MenuBar from "./MenuBar";
import BatchToolbar from "./BatchToolbar";
import { Checkbox } from "@mui/material";
import FileKebabMenu from "./FileKebabMenu";
import {
  getFolders,
  createFolder,
  updateFolder,
  getBreadcrumb,
  getStarredFolders,
  getTrashFolders,
  getSharedFolders,
  getRecentFolders,
  copyFolder,
  getFolder,
  downloadFolderZip,
} from "../api/foldersApi";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useFiles } from "../context/fileContext.jsx";
import FolderDetailsPanel from "./FolderDetailsPanel";
import RenameDialog from "./RenameDialog.jsx";



const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
};

import DetailsPanel from "./DetailsPanel.jsx";
import ShareDialog from "./ShareDialog.jsx";

function Homepage({ initialView = "MY_DRIVE" }) {
  const { files, sharedFiles, loading, selectedFiles, toggleFileSelection, selectAll, selectedFolders, toggleFolderSelection, clearSelection, refreshFiles } = useFiles();
  const [detailsPanelOpen, setDetailsPanelOpen] = React.useState(false);
  const [detailsFile, setDetailsFile] = React.useState(null);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [fileToShare, setFileToShare] = React.useState(null);
  const [viewMode, setViewMode] = React.useState("list");

  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [menuPosition, setMenuPosition] = React.useState(null);

  const [selectedFile, setSelectedFile] = React.useState(null);

  const menuOpen = Boolean(menuAnchorEl) || Boolean(menuPosition);

  const anchorPosition = menuPosition
    ? { top: menuPosition.mouseY, left: menuPosition.mouseX }
    : undefined;

  const handleMenuButtonClick = (event, item) => {
    event.stopPropagation?.();
    setSelectedFile(item);
    setMenuPosition(null);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleContextMenu = (event, item) => {
    event.preventDefault();
    event.stopPropagation?.();
    setSelectedFile(item);
    setMenuAnchorEl(null);
    setMenuPosition({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
    });
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuPosition(null);
    setSelectedFile(null);
  };

  const recentFiles = [...files]
    .filter((file) => !file.isDeleted)
    .sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt))
    .slice(0, 20);

  const [folderMenuAnchor, setFolderMenuAnchor] = React.useState(null);
  const [selectedFolder, setSelectedFolder] = React.useState(null);
  const folderMenuOpen = Boolean(folderMenuAnchor);

  const [folderDetailsOpen, setFolderDetailsOpen] = React.useState(false);
  const [folderDetails, setFolderDetails] = React.useState(null);
  const [folderDetailsLoading, setFolderDetailsLoading] = React.useState(false);
  const [folderDetailsError, setFolderDetailsError] =
    React.useState(null);

  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [renameTarget, setRenameTarget] = React.useState(null); // folder we’re renaming
  const [copyDialogOpen, setCopyDialogOpen] = React.useState(false);
  const [copyTarget, setCopyTarget] = React.useState(null);

  const [newFolderDialogOpen, setNewFolderDialogOpen] =
    React.useState(false);

  const handleFolderMenuOpen = (event, folder) => {
    event.stopPropagation?.();
    setFolderMenuAnchor(event.currentTarget);
    setSelectedFolder(folder);
  };

  const handleFolderMenuClose = () => {
    setFolderMenuAnchor(null);
    setSelectedFolder(null);
  };

  const handleFolderShare = () => {
    if (!selectedFolder) return;

    const folderItem = {
      ...selectedFolder,
      isFolder: true,
      id: selectedFolder.publicId || selectedFolder._id,
      name: selectedFolder.name,
    };

    setFileToShare(folderItem);
    setShareDialogOpen(true);
  };


  const handleFolderDetails = async () => {
    if (!selectedFolder) return;

    try {
      setFolderDetailsLoading(true);
      setFolderDetailsError(null);

      const full = await getFolder(
        selectedFolder.publicId || selectedFolder._id
      );

      setFolderDetails(full);
      setFolderDetailsOpen(true);
    } catch (err) {
      console.error("Failed to load folder details", err);
      setFolderDetailsError(err.message || "Failed to load folder details");
      setFolderDetailsOpen(true);
    } finally {
      setFolderDetailsLoading(false);
    }
  };

  const handleFolderDescriptionUpdated = (updatedFolder) => {
    setFolderDetails(updatedFolder);

    // also refresh the folders list so the new description/flags show
    setRootFolders((prev) =>
      prev.map((f) =>
        f._id === updatedFolder._id || f.publicId === updatedFolder.publicId
          ? updatedFolder
          : f
      )
    );
  };

  const handleDownloadFolder = () => {
    if (!selectedFolder) return;
    downloadFolderZip(selectedFolder.publicId || selectedFolder._id);
  };


  const { folderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentFolderId, setCurrentFolderId] = React.useState(
    folderId || null
  );

  const [currentView, setCurrentView] = React.useState(initialView);

  useEffect(() => {
    setCurrentFolderId(folderId || null);
  }, [folderId]);

  useEffect(() => {
    setCurrentView(initialView);
  }, [initialView]);

  useEffect(() => {
    clearSelection();
  }, [currentView, currentFolderId, clearSelection]);

  const [breadcrumb, setBreadcrumb] = React.useState([]);
  const [breadcrumbLoading, setBreadcrumbLoading] = React.useState(false);
  const [breadcrumbError, setBreadcrumbError] = React.useState(null);

  const [rootFolders, setRootFolders] = React.useState([]);
  const [foldersLoading, setFoldersLoading] = React.useState(true);
  const [foldersError, setFoldersError] = React.useState(null);

  const isHomeView = currentView === "HOME";
  const isMyDriveRoot = currentView === "MY_DRIVE" && currentFolderId === null;
  const isFolderView = (currentView === "MY_DRIVE" || currentView === "HOME") && currentFolderId !== null;

  // last breadcrumb item is the current folder
  const currentFolderObjectId =
    isFolderView && !breadcrumbLoading && breadcrumb.length > 0
      ? breadcrumb[breadcrumb.length - 1]?._id
      : null;

  const allFiles = React.useMemo(() => {
    const map = new Map();

    [...files, ...sharedFiles].forEach((file) => {
      if (!file) return;
      map.set(file.id, file); // avoid duplicates if same file appears in both
    });

    return Array.from(map.values());
  }, [files, sharedFiles]);


  const filesInCurrentFolder = React.useMemo(() => {
    // We need files for unified list if we are in MY_DRIVE view (either root or subfolder)
    if (currentView !== "MY_DRIVE") return [];

    const folderIdString = currentFolderObjectId ? currentFolderObjectId.toString() : null;

    return allFiles.filter((f) => {
      if (f.isDeleted) return false;

      // only My Drive files
      if (
        !(
          (f.location?.toLowerCase() === "my drive") ||
          !f.location
        )
      ) {
        return false;
      }

      if (currentFolderId) {
        // Subfolder
        if (!f.folderId) return false;
        return f.folderId.toString() === folderIdString;
      } else {
        // Root
        return !f.folderId;
      }
    });
  }, [allFiles, currentView, currentFolderId, currentFolderObjectId]);

  const unifiedItems = React.useMemo(() => {
    if (currentView !== "MY_DRIVE") return [];

    const folders = rootFolders.map(f => ({ ...f, type: 'folder' }));
    const files = filesInCurrentFolder.map(f => ({ ...f, type: 'file' }));

    // Sort: Folders first, then files. Within each type, sort by name.
    return [...folders, ...files].sort((a, b) => {
      if (a.type === b.type) {
        return (a.name || "").localeCompare(b.name || "");
      }
      return a.type === 'folder' ? -1 : 1;
    });
  }, [rootFolders, filesInCurrentFolder, currentView]);






  const loadFoldersForCurrentView = async () => {
    try {
      setFoldersLoading(true);
      setFoldersError(null);

      let folders;

      if (currentView === "MY_DRIVE" || currentView === "HOME") {
        folders = await getFolders(currentFolderId);
      } else if (currentView === "STARRED") {
        folders = await getStarredFolders();
      } else if (currentView === "TRASH") {
        folders = await getTrashFolders();
      } else if (currentView === "SHARED") {
        folders = await getSharedFolders();
      } else if (currentView === "RECENT") {
        folders = await getRecentFolders(30);
      }

      setRootFolders(folders);
    } catch (err) {
      console.error("Failed to load folders", err);
      setFoldersError(err.message || "Failed to load folders");
    } finally {
      setFoldersLoading(false);
    }
  };

  useEffect(() => {
    loadFoldersForCurrentView();
  }, [currentView, currentFolderId]);

  useEffect(() => {
    if (currentView === "STARRED") {
      setBreadcrumb([{ _id: null, name: "Starred" }]);
      setBreadcrumbLoading(false);
      return;
    }

    if (currentView === "TRASH") {
      setBreadcrumb([{ _id: null, name: "Trash" }]);
      setBreadcrumbLoading(false);
      return;
    }

    if (currentView === "SHARED") {
      setBreadcrumb([{ _id: null, name: "Shared with me" }]);
      setBreadcrumbLoading(false);
      return;
    }

    if (currentView === "RECENT") {
      setBreadcrumb([{ _id: null, name: "Recent" }]);
      setBreadcrumbLoading(false);
      return;
    }

    if (currentFolderId === null) {
      if (currentView === "HOME") {
        setBreadcrumb([{ _id: null, name: "Home" }]);
      } else {
        setBreadcrumb([{ _id: null, name: "My Drive" }]);
      }
      setBreadcrumbLoading(false);
      return;
    }

    async function loadBreadcrumb() {
      try {
        setBreadcrumbLoading(true);

        const chain = await getBreadcrumb(currentFolderId);
        setBreadcrumb(chain);
      } catch (err) {
        console.error("Failed to load breadcrumb", err);
        setBreadcrumbError(err.message || "Failed to load breadcrumb");
      } finally {
        setBreadcrumbLoading(false);
      }
    }

    loadBreadcrumb();
  }, [currentView, currentFolderId]);

  const handleFolderOpen = (folderId) => {
    navigate(`/folders/${folderId}`);
  };



  const handleRenameFolder = () => {
    if (!selectedFolder) return;
    setRenameTarget(selectedFolder);
    setRenameDialogOpen(true);
  };

  const handleFolderRenameSubmit = async (newName) => {
    if (!renameTarget) {
      setRenameDialogOpen(false);
      return;
    }

    const trimmed = newName.trim();
    if (!trimmed) {
      setRenameDialogOpen(false);
      return;
    }

    try {
      setFoldersLoading(true);
      setFoldersError(null);

      await updateFolder(renameTarget.publicId || renameTarget._id, {
        name: trimmed,
      });

      await loadFoldersForCurrentView();
    } catch (err) {
      console.error("Failed to rename folder", err);
      setFoldersError(err.message || "Failed to rename folder");
    } finally {
      setFoldersLoading(false);
      setRenameDialogOpen(false);
      setRenameTarget(null);
      handleFolderMenuClose();
    }
  };

  const handleTrashFolder = async () => {
    if (!selectedFolder) return;

    const isCurrentlyTrashed =
      currentView === "TRASH" || selectedFolder.isDeleted;

    if (isCurrentlyTrashed) {
      const confirmRestore = window.confirm(
        `Restore "${selectedFolder.name}" from trash?`
      );
      if (!confirmRestore) return;

      try {
        setFoldersLoading(true);
        setFoldersError(null);

        await updateFolder(selectedFolder.publicId || selectedFolder._id, {
          isDeleted: false,
        });

        await loadFoldersForCurrentView();
        await refreshFiles();
      } catch (err) {
        console.error("Failed to restore folder", err);
        setFoldersError(err.message || "Failed to restore folder");
      } finally {
        setFoldersLoading(false);
        handleFolderMenuClose();
      }
    } else {
      const confirmDelete = window.confirm(
        `Move "${selectedFolder.name}" to trash?`
      );
      if (!confirmDelete) return;

      try {
        setFoldersLoading(true);
        setFoldersError(null);

        await updateFolder(selectedFolder.publicId || selectedFolder._id, {
          isDeleted: true,
        });

        await loadFoldersForCurrentView();
        await refreshFiles();
      } catch (err) {
        console.error("Failed to remove folder", err);
        setFoldersError(err.message || "Failed to remove folder");
      } finally {
        setFoldersLoading(false);
        handleFolderMenuClose();
      }
    }
  };

  const handleToggleStarFolder = async () => {
    if (!selectedFolder) return;

    const newStarValue = !selectedFolder.isStarred;

    try {
      setFoldersLoading(true);
      setFoldersError(null);

      await updateFolder(selectedFolder.publicId || selectedFolder._id, {
        isStarred: newStarValue,
      });

      await loadFoldersForCurrentView();
      await refreshFiles();
    } catch (err) {
      console.error("Failed to update star", err);
      setFoldersError(err.message || "Failed to update star");
    } finally {
      setFoldersLoading(false);
      handleFolderMenuClose();
    }
  };

  // 1) Called when user clicks "Make a copy" in folder kebab menu
  const handleCopyFolder = () => {
    if (!selectedFolder) return;
    setCopyTarget(selectedFolder);
    setCopyDialogOpen(true);
    handleFolderMenuClose();
  };

  // 2) Called when user submits the dialog with a name
  const handleFolderCopySubmit = async (newName) => {
    if (!copyTarget) {
      setCopyDialogOpen(false);
      return;
    }

    const trimmed = newName.trim();
    if (!trimmed) {
      setCopyDialogOpen(false);
      return;
    }

    try {
      setFoldersLoading(true);
      setFoldersError(null);

      await copyFolder(copyTarget.publicId || copyTarget._id, {
        name: trimmed,
        parentFolder: currentView === "MY_DRIVE" ? currentFolderId : null,
      });

      await loadFoldersForCurrentView();
      await refreshFiles();
    } catch (err) {
      console.error("Failed to copy folder", err);
      setFoldersError(err.message || "Failed to copy folder");
    } finally {
      setFoldersLoading(false);
      setCopyDialogOpen(false);
      setCopyTarget(null);
    }
  };


  const suggestedFiles = recentFiles.map((file) => ({
    ...file,
    reason: file.lastAccessedAt
      ? `You opened ${new Date(file.lastAccessedAt).toLocaleDateString()}`
      : "Recently added",
  }));

  useEffect(() => {
    if (!selectedFile) return;

    const updated = files.find(f => f.id === selectedFile.id);
    if (updated) setSelectedFile(updated);
  }, [files, selectedFile]);

  useEffect(() => {
    if (!detailsFile) return;

    const updated = files.find(f => f.id === detailsFile.id);
    if (updated) setDetailsFile(updated);
  }, [files, detailsFile]);



  if (loading) {
    return <Typography sx={{ p: 2 }}>Loading recent files...</Typography>;
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        px: 6, // horizontal padding
        pt: 3, // smaller top padding
        pb: 6, // bottom padding
        marginTop: "64px",
        backgroundColor: "#ffffff",
        height: "calc(100vh - 64px)",
        overflowY: "auto",
        color: "#000000ff",
      }}
    >
      {/* Top small link when inside a folder */}
      {isFolderView && (
        <Typography
          variant="body2"
          sx={{
            mb: 1,
            color: "#1a73e8",
            cursor: "pointer",
            textDecoration: "underline",
            width: "fit-content",
          }}
          onClick={() => navigate(currentView === "HOME" ? "/" : "/mydrive")}
        >
          {currentView === "HOME" ? "← Home" : "← My Drive"}
        </Typography>
      )}

      {/* Main title: “Welcome to Drive” OR current folder name */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        {isFolderView
          ? breadcrumbLoading
            ? "Loading folder..."
            : breadcrumb[breadcrumb.length - 1]?.name || "Folder"
          : "Welcome to Drive"}
      </Typography>

      <Box sx={{ mt: 1, mb: 2 }}>
        {breadcrumbLoading ? (
          <Typography variant="body2" sx={{ color: "#5f6368" }}>
            Loading path...
          </Typography>
        ) : breadcrumbError ? (
          <Typography variant="body2" sx={{ color: "red" }}>
            {breadcrumbError}
          </Typography>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            {breadcrumb.map((item, index) => {
              const isLast = index === breadcrumb.length - 1;
              const isRoot = item._id === null;

              const handleClickCrumb = () => {
                if (isLast) return;

                if (item._id === null) {
                  navigate("/drive");
                } else {
                  navigate(`/folders/${item.publicId || item._id}`);
                }
              };

              return (
                <React.Fragment key={item._id ?? "root"}>
                  <Typography
                    variant="body2"
                    onClick={!isLast ? handleClickCrumb : undefined}
                    sx={{
                      cursor: !isLast ? "pointer" : "default",
                      fontWeight: isLast ? 600 : 400,
                      color: isLast ? "#202124" : "#1a73e8",
                      textDecoration: !isLast ? "underline" : "none",
                    }}
                  >
                    {isRoot ? "My Drive" : item.name}
                  </Typography>

                  {!isLast && (
                    <Typography variant="body2" sx={{ color: "#5f6368" }}>
                      /
                    </Typography>
                  )}
                </React.Fragment>
              );
            })}
          </Box>
        )}
      </Box>

      {selectedFiles.size > 0 || selectedFolders.size > 0 ? (
        <BatchToolbar />
      ) : (
        <MenuBar visibleFiles={recentFiles} />
      )}

      {/* FOLDERS ACCORDION - ONLY FOR HOME OR OTHER VIEWS, NOT MY_DRIVE (UNIFIED) */}
      {currentView !== "MY_DRIVE" && (
        <Accordion
          defaultExpanded
          disableGutters
          square
          sx={{
            backgroundColor: "transparent",
            boxShadow: "none",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: "#5f6368" }} />}
            sx={{
              backgroundColor: "#ffffff",
              borderRadius: "9999px",
              px: 1.5,
              py: 0.5,
              width: "fit-content",
              transition: "all 0.2s ease",
              "& .MuiAccordionSummary-content": {
                marginY: 0,
                marginLeft: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              },
              "&:hover": {
                backgroundColor: "#e8f0fe",
                "& .MuiTypography-root": { color: "#1a73e8" },
                "& .MuiSvgIcon-root": { color: "#1a73e8" },
              },
            }}
          >
            <Typography sx={{ fontWeight: 600, color: "#202124" }}>
              {isHomeView ? "Suggested folders" : "Folders"}
            </Typography>

          </AccordionSummary>

          <AccordionDetails sx={{ backgroundColor: "#ffffff", px: 0 }}>
            <Grid container spacing={2}>
              {foldersLoading && (
                <Grid item xs={12}>
                  <Typography sx={{ color: "#5f6368", px: 1 }}>
                    Loading folders...
                  </Typography>
                </Grid>
              )}

              {foldersError && !foldersLoading && (
                <Grid item xs={12}>
                  <Typography sx={{ color: "red", px: 1 }}>
                    {foldersError}
                  </Typography>
                </Grid>
              )}

              {!foldersLoading && !foldersError && rootFolders.length === 0 && (
                <Grid item xs={12}>
                  <Typography sx={{ color: "#5f6368", px: 1 }}>
                    {isHomeView
                      ? "No folders in Home yet."
                      : "This folder is empty."}
                  </Typography>
                </Grid>
              )}

              {!foldersLoading &&
                !foldersError &&
                rootFolders.map((folder) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    key={folder.publicId || folder._id}
                  >
                    <Paper
                      elevation={0}
                      onClick={() =>
                        handleFolderOpen(folder.publicId || folder._id)
                      }
                      sx={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2,
                        border: "1px solid #e0e0e0",
                        borderRadius: 3,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        backgroundColor: selectedFolders.has(folder.publicId || folder._id) ? "#e8f0fe" : "#ffffff",
                        "&:hover": {
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.15)",
                          transform: "translateY(-2px)",
                          "& .folder-checkbox": { opacity: 1 },
                        },
                        height: "25%",
                      }}
                    >
                      <Box
                        className="folder-checkbox"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          opacity: selectedFolders.has(folder.publicId || folder._id) ? 1 : 0,
                          transition: "opacity 0.2s",
                          zIndex: 1,
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={selectedFolders.has(folder.publicId || folder._id)}
                          onChange={() => toggleFolderSelection(folder.publicId || folder._id)}
                        />
                      </Box>

                      <FolderIcon sx={{ fontSize: 36, color: "#4285f4" }} />

                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>
                          {folder.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "#5f6368" }}
                        >
                          {folder.location === "TRASH"
                            ? "In Trash"
                            : folder.location === "SHARED"
                              ? "In Shared with me"
                              : "In My Drive"}
                        </Typography>
                      </Box>

                      <IconButton
                        size="small"
                        onClick={(e) => handleFolderMenuOpen(e, folder)}
                      >
                        <MoreVertIcon sx={{ color: "#5f6368" }} />
                      </IconButton>
                    </Paper>
                  </Grid>
                ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* FILES IN CURRENT FOLDER – only in folder view AND NOT MY_DRIVE (since MY_DRIVE uses unified list) */}
      {isFolderView && currentView !== "MY_DRIVE" && (
        <Accordion
          defaultExpanded
          disableGutters
          square
          sx={{
            backgroundColor: "transparent",
            boxShadow: "none",
            "&:before": { display: "none" },
            mt: 3,
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: "#5f6368" }} />}
            sx={{
              backgroundColor: "#ffffff",
              borderRadius: "9999px",
              px: 1.5,
              py: 0.5,
              width: "fit-content",
              transition: "all 0.2s ease",
              "& .MuiAccordionSummary-content": {
                marginY: 0,
                marginLeft: 0.5,
              },
              "&:hover": {
                backgroundColor: "#e8f0fe",
                "& .MuiTypography-root": { color: "#1a73e8" },
                "& .MuiSvgIcon-root": { color: "#1a73e8" },
              },
            }}
          >
            <Typography sx={{ fontWeight: 600, color: "#202124" }}>
              Files in this folder
            </Typography>
          </AccordionSummary>

          <AccordionDetails sx={{ backgroundColor: "#ffffff", px: 0 }}>
            {filesInCurrentFolder.length === 0 ? (
              <Typography sx={{ px: 2, py: 3, color: "#5f6368" }}>
                This folder has no files yet.
              </Typography>
            ) : (
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
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ width: 40, display: "flex", justifyContent: "center" }}>
                    <Checkbox
                      size="small"
                      checked={
                        filesInCurrentFolder.length > 0 &&
                        filesInCurrentFolder.every((f) => selectedFiles.has(f.id))
                      }
                      indeterminate={
                        filesInCurrentFolder.some((f) => selectedFiles.has(f.id)) &&
                        !filesInCurrentFolder.every((f) => selectedFiles.has(f.id))
                      }
                      onChange={() => {
                        const allSelected = filesInCurrentFolder.every((f) =>
                          selectedFiles.has(f.id)
                        );
                        if (allSelected) {
                          filesInCurrentFolder.forEach((f) => {
                            if (selectedFiles.has(f.id)) toggleFileSelection(f.id);
                          });
                        } else {
                          filesInCurrentFolder.forEach((f) => {
                            if (!selectedFiles.has(f.id)) toggleFileSelection(f.id);
                          });
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 3 }}>Name</Box>
                  <Box sx={{ flex: 2 }}>Owner</Box>
                  <Box sx={{ flex: 2 }}>Date modified</Box>
                  <Box sx={{ width: 40 }} />
                </Box>

                {filesInCurrentFolder.map((file) => (
                  <Box
                    key={file.id}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                    onClick={(e) => {
                      // Optional: handle row click
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 2,
                      py: 1.5,
                      borderBottom: "1px solid #f1f3f4",
                      cursor: "pointer",
                      backgroundColor: selectedFiles.has(file.id) ? "#e8f0fe" : "transparent",
                      "&:hover": {
                        backgroundColor: selectedFiles.has(file.id) ? "#e8f0fe" : "#f8f9fa",
                        "& .file-checkbox": { opacity: 1 },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        display: "flex",
                        justifyContent: "center",
                        opacity: selectedFiles.has(file.id) ? 1 : 0,
                        transition: "opacity 0.2s",
                      }}
                      className="file-checkbox"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        size="small"
                        checked={selectedFiles.has(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                      />
                    </Box>

                    <Box
                      sx={{
                        flex: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <img
                        src={file.icon || DEFAULT_FILE_ICON}
                        alt="file icon"
                        width={20}
                        height={20}
                      />
                      <Typography sx={{ fontWeight: 500 }}>
                        {file.name}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 2 }}>
                      <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                        {file.owner || "Unknown"}
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
                        onClick={(e) => handleMenuButtonClick(e, file)}
                      >
                        <MoreVertIcon sx={{ color: "#5f6368" }} />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </>
            )}


          </AccordionDetails>
        </Accordion >
      )
      }



      {/* SUGGESTED FILES ACCORDION – ONLY ON HOME VIEW */}
      {
        isHomeView && (
          <Accordion
            defaultExpanded
            disableGutters
            square
            sx={{
              backgroundColor: "transparent",
              boxShadow: "none",
              "&:before": { display: "none" },
              mt: 3,
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "#5f6368" }} />}
              sx={{
                backgroundColor: "#ffffff",
                borderRadius: "9999px",
                px: 1.5,
                py: 0.5,
                width: "fit-content",
                transition: "all 0.2s ease",
                "& .MuiAccordionSummary-content": {
                  marginY: 0,
                  marginLeft: 0.5,
                },
                "&:hover": {
                  backgroundColor: "#e8f0fe",
                  "& .MuiTypography-root": { color: "#1a73e8" },
                  "& .MuiSvgIcon-root": { color: "#1a73e8" },
                },
              }}
            >
              <Typography sx={{ fontWeight: 600, color: "#202124" }}>
                Suggested files
              </Typography>
            </AccordionSummary>

            <AccordionDetails sx={{ backgroundColor: "#ffffff", px: 0 }}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => setViewMode("list")}
                  sx={{
                    color: viewMode === "list" ? "#1a73e8" : "#5f6368",
                  }}
                >
                  <ListIcon />
                </IconButton>

                <IconButton
                  size="small"
                  onClick={() => setViewMode("grid")}
                  sx={{
                    color: viewMode === "grid" ? "#1a73e8" : "#5f6368",
                  }}
                >
                  <GridViewIcon />
                </IconButton>
              </Box>

              {viewMode === "list" ? (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      px: 2,
                      py: 1,
                      borderBottom: "1px solid #e0e0e0",
                      color: "#5f6368",
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    <Box sx={{ flex: 3 }}>Name</Box>
                    <Box sx={{ flex: 2 }}>Reason suggested</Box>
                    <Box sx={{ flex: 2 }}>Owner</Box>
                    <Box sx={{ flex: 2 }}>Location</Box>
                    <Box sx={{ width: 40 }}></Box>
                  </Box>

                  {suggestedFiles.map((file) => (
                    <Box
                      key={file.id}
                      onContextMenu={(e) => handleContextMenu(e, file)}
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
                        <img src={file.icon} alt="" width={20} height={20} />
                        <Typography sx={{ fontWeight: 500 }}>
                          {file.name}
                        </Typography>
                      </Box>

                      <Box sx={{ flex: 2 }}>
                        <Typography
                          sx={{ color: "#5f6368", fontSize: 14 }}
                        >
                          {file.reason}
                        </Typography>
                      </Box>

                      <Box sx={{ flex: 2 }}>
                        <Typography
                          sx={{ color: "#5f6368", fontSize: 14 }}
                        >
                          {file.owner}
                        </Typography>
                      </Box>

                      <Box sx={{ flex: 2 }}>
                        <Typography
                          sx={{ color: "#5f6368", fontSize: 14 }}
                        >
                          {file.location}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          width: 40,
                          justifyContent: "flex-end",
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuButtonClick(e, file)}
                        >
                          <MoreVertIcon sx={{ color: "#5f6368" }} />
                        </IconButton>
                      </Box>
                    </Box>
                  ))
                  }
                </>
              ) : (
                <Grid container spacing={2} sx={{ px: 2, py: 1 }}>
                  {suggestedFiles.length === 0 ? (
                    <Typography sx={{ px: 2, py: 3, color: "#5f6368" }}>
                      No files match the current filters.
                    </Typography>
                  ) : (
                    suggestedFiles.map((file, index) => (
                      <Grid item xs={12} sm={6} md={3} lg={2} key={index}>
                        <Paper
                          elevation={0}
                          onContextMenu={(e) => handleContextMenu(e, file)}
                          sx={{
                            position: "relative",
                            border: "1px solid #e0e0e0",
                            borderRadius: 2,
                            overflow: "hidden",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.15)",
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          <IconButton
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                            }}
                            onClick={(e) => handleMenuButtonClick(e, file)}
                          >
                            <MoreVertIcon sx={{ color: "#5f6368" }} />
                          </IconButton>

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              height: 120,
                              backgroundColor: "#f8f9fa",
                            }}
                          >
                            <img
                              src={file.icon}
                              alt="file icon"
                              width={40}
                              height={40}
                            />
                          </Box>

                          <Box sx={{ p: 1.5 }}>
                            <Typography
                              sx={{
                                fontWeight: 500,
                                fontSize: 14,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {file.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#5f6368",
                                fontSize: 12,
                                mt: 0.5,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {file.owner}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))
                  )}
                </Grid>
              )
              }
            </AccordionDetails >
          </Accordion >
        )
      }

      {/* UNIFIED LIST VIEW - ONLY FOR MY_DRIVE */}
      {currentView === "MY_DRIVE" && (
        <Box sx={{ mt: 2 }}>
          {/* Header Row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2,
              py: 1,
              borderBottom: "1px solid #e0e0e0",
              color: "#5f6368",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <Box sx={{ width: 40, display: "flex", justifyContent: "center" }}>
              <Checkbox
                size="small"
                checked={
                  unifiedItems.length > 0 &&
                  unifiedItems.every((item) =>
                    item.type === 'folder' ? selectedFolders.has(item.publicId || item._id) : selectedFiles.has(item.id)
                  )
                }
                indeterminate={
                  unifiedItems.some((item) =>
                    item.type === 'folder' ? selectedFolders.has(item.publicId || item._id) : selectedFiles.has(item.id)
                  ) &&
                  !unifiedItems.every((item) =>
                    item.type === 'folder' ? selectedFolders.has(item.publicId || item._id) : selectedFiles.has(item.id)
                  )
                }
                onChange={() => {
                  const allSelected = unifiedItems.every((item) =>
                    item.type === 'folder' ? selectedFolders.has(item.publicId || item._id) : selectedFiles.has(item.id)
                  );

                  if (allSelected) {
                    clearSelection();
                  } else {
                    // Select all
                    const fileIds = [];
                    const folderIds = [];
                    unifiedItems.forEach(item => {
                      if (item.type === 'folder') folderIds.push(item.publicId || item._id);
                      else fileIds.push(item.id);
                    });
                    // We need to call selectAll with objects? No, context selectAll takes items.
                    // But context selectAll logic separates them.
                    // We can manually select all.
                    unifiedItems.forEach(item => {
                      if (item.type === 'folder') {
                        if (!selectedFolders.has(item.publicId || item._id)) toggleFolderSelection(item.publicId || item._id);
                      } else {
                        if (!selectedFiles.has(item.id)) toggleFileSelection(item.id);
                      }
                    });
                  }
                }}
              />
            </Box>
            <Box sx={{ flex: 3 }}>Name</Box>
            <Box sx={{ flex: 2 }}>Owner</Box>
            <Box sx={{ flex: 2 }}>Last modified</Box>
            <Box sx={{ width: 40 }} />
          </Box>

          {/* List Items */}
          {unifiedItems.length === 0 ? (
            <Typography sx={{ px: 2, py: 3, color: "#5f6368" }}>
              {isMyDriveRoot ? "My Drive is empty." : "This folder is empty."}
            </Typography>
          ) : (
            unifiedItems.map((item) => {
              const isFolderItem = item.type === 'folder';
              const id = isFolderItem ? (item.publicId || item._id) : item.id;
              const selected = isFolderItem ? selectedFolders.has(id) : selectedFiles.has(id);

              return (
                <Box
                  key={isFolderItem ? `folder-${id}` : `file-${id}`}
                  onContextMenu={(e) => isFolderItem ? handleFolderMenuOpen(e, item) : handleContextMenu(e, item)}
                  onClick={(e) => {
                    if (isFolderItem) handleFolderOpen(id);
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid #f1f3f4",
                    cursor: "pointer",
                    backgroundColor: selected ? "#e8f0fe" : "transparent",
                    "&:hover": {
                      backgroundColor: selected ? "#e8f0fe" : "#f8f9fa",
                      "& .item-checkbox": { opacity: 1 },
                    },
                  }}
                >
                  <Box
                    className="item-checkbox"
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      width: 40,
                      display: "flex",
                      justifyContent: "center",
                      opacity: selected ? 1 : 0,
                      transition: "opacity 0.2s",
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={selected}
                      onChange={() => isFolderItem ? toggleFolderSelection(id) : toggleFileSelection(id)}
                    />
                  </Box>

                  <Box sx={{ flex: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
                    {isFolderItem ? (
                      <FolderIcon sx={{ color: "#5f6368", fontSize: 24 }} />
                    ) : (
                      <img src={item.icon || "https://www.gstatic.com/images/icons/material/system/2x/insert_drive_file_black_24dp.png"} alt="" width={24} height={24} />
                    )}
                    <Typography sx={{ fontWeight: 500 }}>{item.name}</Typography>
                  </Box>

                  <Box sx={{ flex: 2 }}>
                    <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                      {item.owner || "Unknown"}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 2 }}>
                    <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                      {formatDate(item.updatedAt || item.lastAccessedAt || item.uploadedAt)}
                    </Typography>
                  </Box>

                  <Box sx={{ width: 40, display: "flex", justifyContent: "flex-end" }}>
                    <IconButton
                      size="small"
                      onClick={(e) => isFolderItem ? handleFolderMenuOpen(e, item) : handleMenuButtonClick(e, item)}
                    >
                      <MoreVertIcon sx={{ color: "#5f6368" }} />
                    </IconButton>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      )}

      <FileKebabMenu
        anchorEl={folderMenuAnchor}
        anchorPosition={null}
        open={folderMenuOpen}
        onClose={handleFolderMenuClose}
        onRename={handleRenameFolder}
        onTrash={handleTrashFolder}
        onToggleStar={handleToggleStarFolder}
        onCopy={handleCopyFolder}
        isStarred={selectedFolder?.isStarred}
        isInTrash={currentView === "TRASH" || selectedFolder?.isDeleted}
        onFolderShare={handleFolderShare}
        onFolderDetails={handleFolderDetails}
        onDownloadFolder={handleDownloadFolder}
      />

      <FileKebabMenu
        anchorEl={menuAnchorEl}
        anchorPosition={anchorPosition}
        open={menuOpen}
        onClose={handleMenuClose}
        selectedFile={selectedFile}
        onStartShare={(file) => {
          setFileToShare(file);
          setShareDialogOpen(true);
        }}
        onViewDetails={(file) => {
          setDetailsFile(file);
          setDetailsPanelOpen(true);
        }}
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

      <ShareDialog
        open={shareDialogOpen}
        file={fileToShare}
        onClose={() => {
          setShareDialogOpen(false);
          setFileToShare(null);
        }}
      />




      <FolderDetailsPanel
        open={folderDetailsOpen}
        onClose={() => setFolderDetailsOpen(false)}
        folder={folderDetails || selectedFolder}
        onDescriptionUpdated={handleFolderDescriptionUpdated}
      />

      <RenameDialog
        open={renameDialogOpen}
        file={renameTarget}
        onClose={() => {
          setRenameDialogOpen(false);
          setRenameTarget(null);
        }}
        onSubmit={handleFolderRenameSubmit}
      />

      <RenameDialog
        open={copyDialogOpen}
        file={copyTarget}
        title="Make a copy"
        submitLabel="Make copy"
        placeholder="Copy name"
        onClose={() => {
          setCopyDialogOpen(false);
          setCopyTarget(null);
        }}
        onSubmit={handleFolderCopySubmit}
      />
    </Box>
  );
}

export default Homepage;

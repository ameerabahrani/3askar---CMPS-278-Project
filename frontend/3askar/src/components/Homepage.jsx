import React from "react";
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Button} from "@mui/material";
import { Grid, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add"
import FolderIcon from "@mui/icons-material/Folder";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import MenuBar from "./MenuBar";
import FileKebabMenu from "./FileKebabMenu";
import { getFolders, createFolder, updateFolder, getBreadcrumb, getStarredFolders, getTrashFolders, getSharedFolders, getRecentFolders, copyFolder } from "../api/foldersApi";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useFiles } from "../context/fileContext.jsx";
function Homepage({ initialView = "MY_DRIVE" }) {
  const{ files, loading } = useFiles();

  //TODO check if needed? here
  if (loading) {
    return (
      <Typography sx={{ p: 2 }}>Loading recent files...</Typography>
    );
  }
    

  const recentFiles = [...files]
  .filter((file) => !file.isDeleted)
  .sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt))
  .slice(0, 20);

  const [viewMode, setViewMode] = React.useState("list");


 

  // Folder action menu (for folders in "Suggested folders")
  const [folderMenuAnchor, setFolderMenuAnchor] = React.useState(null);
  const [selectedFolder, setSelectedFolder] = React.useState(null);
  const folderMenuOpen = Boolean(folderMenuAnchor);

  const handleFolderMenuOpen = (event, folder) => {
    event.stopPropagation?.();          // don't trigger card click (open folder)
    setFolderMenuAnchor(event.currentTarget);
    setSelectedFolder(folder);
  };

  const handleFolderMenuClose = () => {
    setFolderMenuAnchor(null);
    setSelectedFolder(null);
  };


  //which folder are we currently viewing? null = My Drive root
  const {folderId} = useParams();
  const navigate = useNavigate();
  const location = useLocation();

const [currentFolderId, setCurrentFolderId] = React.useState(folderId || null);

  // view based on path or prop
  const [currentView, setCurrentView] = React.useState(initialView);
  // Folder comes from URL now:
  React.useEffect(() => {
    setCurrentFolderId(folderId || null);
  }, [folderId]);



  //breadcrumb data for current folder
  const [breadcrumb, setBreadcrumb] = React.useState([]);
  const [breadcrumbLoading, setBreadcrumbLoading] = React.useState(false);
  const [breadcrumbError, setBreadcrumbError] = React.useState(null); 

  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [menuPosition, setMenuPosition] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);

  const menuOpen = Boolean(menuAnchorEl) || Boolean(menuPosition);

  const anchorPosition = menuPosition
    ? { top: menuPosition.mouseY, left: menuPosition.mouseX }
    : undefined;

  const handleMenuButtonClick = (event, item) => {
    event.stopPropagation?.();
    setSelectedItem(item);
    setMenuPosition(null);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleContextMenu = (event, item) => {
    event.preventDefault();
    event.stopPropagation?.();
    setSelectedItem(item);
    setMenuAnchorEl(null);
    setMenuPosition({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
    });
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuPosition(null);
    setSelectedItem(null);
  };

  const [rootFolders, setRootFolders] = React.useState([]);
  const [foldersLoading, setFoldersLoading] = React.useState(true);
  const [foldersError, setFoldersError] = React.useState(null);

    // helper load folders depending on currentView and currentFolderId
  const loadFoldersForCurrentView = async () => {
    try {
      setFoldersLoading(true);
      setFoldersError(null);

      let folders;

      if (currentView === "MY_DRIVE") {
        // My Drive → use parentFolderId (currentFolderId)
        folders = await getFolders(currentFolderId);
      } else if (currentView === "STARRED") {
        folders = await getStarredFolders();
      } else if (currentView === "TRASH") {
        folders = await getTrashFolders();
      } else if (currentView === "SHARED") {
        folders = await getSharedFolders();
      } else if (currentView === "RECENT") {
        folders = await getRecentFolders(30); // or 20, whatever you prefer
      }

      setRootFolders(folders);
    } catch (err) {
      console.error("Failed to load folders", err);
      setFoldersError(err.message || "Failed to load folders");
    } finally {
      setFoldersLoading(false);
    }
  };


  React.useEffect(() => {
    loadFoldersForCurrentView();    // <--- calls our new helper function
  }, [currentView, currentFolderId]);



  // Load breadcrumb when currentFolderId changes
  React.useEffect(() => {
    // Views other than My Drive have simple static breadcrumb
    if (currentView === "STARRED") {
      setBreadcrumb([{ _id: null, name: "Starred" }]);
      setBreadcrumbError(null);
      setBreadcrumbLoading(false);
      return;
    }

    if (currentView === "TRASH") {
      setBreadcrumb([{ _id: null, name: "Trash" }]);
      setBreadcrumbError(null);
      setBreadcrumbLoading(false);
      return;
    }

    if (currentView === "SHARED") {
      setBreadcrumb([{ _id: null, name: "Shared with me" }]);
      setBreadcrumbError(null);
      setBreadcrumbLoading(false);
      return;
    }

    if (currentView === "RECENT") {
      setBreadcrumb([{ _id: null, name: "Recent" }]);
      setBreadcrumbError(null);
      setBreadcrumbLoading(false);
      return;
    }

    // MY_DRIVE logic:
    if (currentFolderId === null) {
      setBreadcrumb([{ _id: null, name: "My Drive" }]);
      setBreadcrumbError(null);
      setBreadcrumbLoading(false);
      return;
    }

    async function loadBreadcrumb() {
      try {
        setBreadcrumbLoading(true);
        setBreadcrumbError(null);

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
      // Go to /folders/:id → triggers useParams → triggers data load
      navigate(`/folders/${folderId}`);
    };



    const handleCreateFolder = async () => {
    const name = window.prompt("Folder name:");
    if (!name || !name.trim()) return;

    try {
      setFoldersLoading(true);
      setFoldersError(null);

      await createFolder({
        name: name.trim(),
        parentFolder: currentFolderId,
      });

      await loadFoldersForCurrentView();  // <--- use helper
    } catch (err) {
      console.error("Failed to create folder", err);
      setFoldersError(err.message || "Failed to create folder");
    } finally {
      setFoldersLoading(false);
    }
  };


    // Rename selected folder
  const handleRenameFolder = async () => {
    if (!selectedFolder) return;

    const newName = window.prompt("New folder name:", selectedFolder.name);
    if (!newName || !newName.trim()) {
      return;
    }

    try {
      setFoldersLoading(true);
      setFoldersError(null);

      await updateFolder(selectedFolder.publicId || selectedFolder._id, {
        name: newName.trim(),
      });

      await loadFoldersForCurrentView(); 
    } catch (err) {
      console.error("Failed to rename folder", err);
      setFoldersError(err.message || "Failed to rename folder");
    } finally {
      setFoldersLoading(false);
      handleFolderMenuClose();
    }
  };

  // Move selected folder to trash (soft delete)
  const handleTrashFolder = async () => {
    if (!selectedFolder) return;

    // If we're in Trash view or folder is already deleted → RESTORE
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
      } catch (err) {
        console.error("Failed to restore folder", err);
        setFoldersError(err.message || "Failed to restore folder");
      } finally {
        setFoldersLoading(false);
        handleFolderMenuClose();
      }
    } else {
      // Not in trash → move to Trash
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
      } catch (err) {
        console.error("Failed to remove folder", err);
        setFoldersError(err.message || "Failed to remove folder");
      } finally {
        setFoldersLoading(false);
        handleFolderMenuClose();
      }
    }
  };


  // Toggle star / unstar
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
    } catch (err) {
      console.error("Failed to update star", err);
      setFoldersError(err.message || "Failed to update star");
    } finally {
      setFoldersLoading(false);
      handleFolderMenuClose();
    }
  };

 


  // TODO - upate to read from database/endpoint/service
  const suggestedFiles = [
  {
    name: "Lecture 26 - Stalling, Branch Data Hazards.pdf",
    reason: "You opened • 6 Nov 2025",
    owner: "cmpstudent@aub.edu.lb",
    location: "lectures",
    icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_pdf_x16.png",
  },
  {
    name: "Econ 211 Test Banks.pdf",
    reason: "You opened • 21 Oct 2025",
    owner: "eduforall6@gmail.com",
    location: "More Previous Drive",
    icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_pdf_x16.png",
  },
];

const handleCopyFolder = async () => {
  if (!selectedFolder) return;

  const defaultName = `${selectedFolder.name} (copy)`;
  const newName = window.prompt("Name for the copy:", defaultName);
  if (newName === null) return; // user cancelled

  const finalName =
    newName && newName.trim() ? newName.trim() : defaultName;

  try {
    setFoldersLoading(true);
    setFoldersError(null);

    await copyFolder(selectedFolder.publicId || selectedFolder._id, {
      name: finalName,
      parentFolder: currentView === "MY_DRIVE" ? currentFolderId : null,
    });

    await loadFoldersForCurrentView();
  } catch (err) {
    console.error("Failed to copy folder", err);
    setFoldersError(err.message || "Failed to copy folder");
  } finally {
    setFoldersLoading(false);
    handleFolderMenuClose();
  }
};



  return (
    <Box
      sx={{
        flexGrow: 1,
        padding: 10,
        marginTop: "64px",
        backgroundColor: "#ffffff",
        height: "calc(100vh - 64px)",
        overflowY: "auto",
        color: "#000000ff",
        borderTopLeftRadius: 12, 
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Welcome to Drive
      </Typography>

      

      {/* Breadcrumb + MenuBar go after this (as you already have) */}


      {currentFolderId !== null && (    //to go back up after going in folder
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            color: "#1a73e8",
            cursor: "pointer",
            textDecoration: "underline",
            width: "fit-content",
          }}
          onClick={() => navigate("/drive")}
        >
          ← Back to My Drive
        </Typography>
      )}

      {/* Breadcrumb */}
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
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5 }}>
            {breadcrumb.map((item, index) => {
              const isLast = index === breadcrumb.length - 1;
              const isRoot = item._id === null;

              const handleClickCrumb = () => {
                if (isLast) return;

                if (item._id === null) {
                  navigate("/drive"); // My Drive root
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

      <MenuBar/>

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
            Suggested folders
          </Typography>

          {/* "New folder" button */}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={(e) => {
              e.stopPropagation(); // prevent accordion from toggling
              handleCreateFolder();
            }}
            sx={{
              textTransform: "none",
              fontSize: 13,
              color: "#1a73e8",
            }}
          >
            New folder
          </Button>
        </AccordionSummary>

                
        <AccordionDetails sx={{ backgroundColor: "#ffffff", px: 0 }}>
          <Grid container spacing={2}>
            {/* Loading */}
            {foldersLoading && (
              <Grid item xs={12}>
                <Typography sx={{ color: "#5f6368", px: 1 }}>
                  Loading folders...
                </Typography>
              </Grid>
            )}

            {/* Error */}
            {foldersError && !foldersLoading && (
              <Grid item xs={12}>
                <Typography sx={{ color: "red", px: 1 }}>
                  {foldersError}
                </Typography>
              </Grid>
            )}

            {/* Empty */}
            {!foldersLoading && !foldersError && rootFolders.length === 0 && (
              <Grid item xs={12}>
                <Typography sx={{ color: "#5f6368", px: 1 }}>
                  No folders in My Drive yet.
                </Typography>
              </Grid>
            )}

            {/* Actual folders from backend */}
            {!foldersLoading &&
              !foldersError &&
              rootFolders.map((folder) => (       //loops through all folders and raws a card for each
                <Grid item xs={12} sm={6} md={4} key={ folder.publicId || folder._id }>
                  <Paper
                    elevation={0}
                    onClick={() => handleFolderOpen(folder.publicId || folder._id)}  //this funct sets current folder ID then get folders is called in backend  and it returns children of that folder 
                    sx={{                                         //and lastly setRoot updates the list to show subfolders inside the one:   Full folder navigation
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2,
                      border: "1px solid #e0e0e0",
                      borderRadius: 3,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        transform: "translateY(-2px)",
                      },
                      height: "25%",
                    }}
                  >
                    <FolderIcon sx={{ fontSize: 36, color: "#4285f4" }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {folder.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#5f6368" }}>    {/*displays where folder belongs*/}
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

                    {/* !removed old menu that was here */}
                    

                  </Paper>
                </Grid>
              ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

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
              sx={{ color: viewMode === "list" ? "#1a73e8" : "#5f6368" }}
              aria-label="List view"
            >
              <ListIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setViewMode("grid")}
              sx={{ color: viewMode === "grid" ? "#1a73e8" : "#5f6368" }}
              aria-label="Grid view"
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

              {suggestedFiles.map((file, index) => (
                <Box
                  key={index}
                  onContextMenu={(e) => handleContextMenu(e, file)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid #f1f3f4",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "#f8f9fa",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", flex: 3, gap: 1.5 }}>
                    <img src={file.icon} alt="" width={20} height={20} />
                    <Typography sx={{ fontWeight: 500, color: "#202124" }}>
                      {file.name}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 2 }}>
                    <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                      {file.reason}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 2 }}>
                    <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                      {file.owner}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 2 }}>
                    <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                      {file.location}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", width: 40, justifyContent: "flex-end" }}>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleMenuButtonClick(e, file)}
                      aria-label="More actions"
                    >
                      <MoreVertIcon sx={{ color: "#5f6368" }} />
                    </IconButton>
                  </Box>
                </Box>
              ))}

            </>
          ) : (
          <Grid container spacing={2} sx={{ px: 2, py: 1 }}>
            {suggestedFiles.map((file, index) => (
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
                      boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <IconButton 
                    size="small" 
                    sx={{ position: "absolute", top: 4, right: 4 }} 
                    onClick={(e) => handleMenuButtonClick(e, file)}
                    aria-label="More actions"
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
                    <img src={file.icon} alt="file icon" width={40} height={40} />
                  </Box>

                  <Box sx={{ p: 1.5 }}>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: 14,
                        color: "#202124",
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
            ))}
          </Grid>
          )}

        </AccordionDetails>
      </Accordion>

      {/*  Shared kebab menu for FOLDERS */}
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
      />

      {/*  Shared kebab menu for Files */}
      <FileKebabMenu
        anchorEl={menuAnchorEl}
        anchorPosition={anchorPosition}
        open={menuOpen}
        onClose={handleMenuClose}
        selectedItem={selectedItem}
      />


    </Box>
  );
}

export default Homepage;

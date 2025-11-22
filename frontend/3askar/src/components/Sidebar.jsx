import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useFiles } from "../context/fileContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  LinearProgress,
  // Divider,
  Collapse,
  Drawer,
  useTheme,
  useMediaQuery,
} from "@mui/material";


import { Menu, MenuItem } from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import HomeFilledIcon from '@mui/icons-material/HomeFilled';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import StarIcon from '@mui/icons-material/Star';
import DevicesIcon from '@mui/icons-material/Devices';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import ReportIcon from '@mui/icons-material/Report';
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DeleteIcon from '@mui/icons-material/Delete';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import WbCloudyIcon from '@mui/icons-material/WbCloudy';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import DriveFolderUploadOutlinedIcon from '@mui/icons-material/DriveFolderUploadOutlined';
import NewFolderDialog from "../context/NewFolderDialog.jsx";
import { createFolder, getFolder } from "../api/foldersApi";




const Sidebar = ({ mobileOpen, onDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { folderId } = useParams();
  const [width, setWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [active, setActive] = useState("home"); // if any element in sidebar is selected 
  const { uploadFiles, uploading } = useFiles();
  const { user } = useAuth() || {};
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 280;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));


  const [openDrive, setOpenDrive] = useState(false);
  const [openComputers, setOpenComputers] = useState(false);

  const connectedDevices = []; // no devices for now (placeholder)

  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);



  // Sidebar Resizing line
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e) => {
      const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
      setWidth(newWidth);
    };

    const stopResizing = () => setIsResizing(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopResizing);
    window.addEventListener("mouseleave", stopResizing);
    window.addEventListener("blur", stopResizing);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopResizing);
      window.removeEventListener("mouseleave", stopResizing);
      window.removeEventListener("blur", stopResizing);
    };
  }, [isResizing, MIN_WIDTH, MAX_WIDTH]);


  const storageLimit = Number(user?.storageLimit) || 0;
  const storageUsed = Number(user?.storageUsed) || 0;
  const usedStorage =
    storageLimit > 0
      ? Math.min(
        100,
        Number(((storageUsed / storageLimit) * 100).toFixed(1))
      )
      : 0;
  const storageSummary =
    storageLimit > 0
      ? `${(storageUsed / 1024 ** 2).toFixed(2)} MB of ${(storageLimit / 1024 ** 2).toFixed(0)} MB used`
      : "Storage info unavailable";

  // New button menu state and refs for uploads
  const [newMenuEl, setNewMenuEl] = useState(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleOpenNewMenu = (e) => setNewMenuEl(e.currentTarget);
  const handleCloseNewMenu = () => setNewMenuEl(null);

  const handleCreateFolder = () => {
    // just open the dialog instead of using window.prompt
    setNewFolderDialogOpen(true);
  };



  const handleSidebarCreateFolderSubmit = async (name) => {
    if (!name || !name.trim()) {
      setNewFolderDialogOpen(false);
      return;
    }

    // figure out which folder we’re in from the URL
    let parentFolder = null;

    // when you are inside /folders/:folderId, use that as parent
    if (location.pathname.startsWith("/folders/") && folderId) {
      parentFolder = folderId; // this is the publicId you navigated with
    }

    try {
      await createFolder({
        name: name.trim(),
        parentFolder, // null = root, id = current folder
      });

      // optional: reload or navigate so new folder shows immediately
      // navigate(0);
    } catch (err) {
      console.error("Failed to create folder from sidebar:", err);
      alert(err.message || "Failed to create folder");
    } finally {
      setNewFolderDialogOpen(false);
    }
  };


  const triggerFileUpload = () => fileInputRef.current?.click();
  const triggerFolderUpload = () => folderInputRef.current?.click();

  const getCurrentFolderOptions = () => {
    // default: root My Drive
    const inFolderView =
      location.pathname.startsWith("/folders/") && folderId;

    return {
      folderId: inFolderView ? folderId : null,  // publicId; backend resolves it
      location: "My Drive",
      // you can later add path here if you want breadcrumb paths
    };
  };

  const resolveCurrentFolderForUploads = async () => {
    let parentFolderId = null;
    let pathArray = [];

    // If we are inside /folders/:folderId → upload into that folder
    if (location.pathname.startsWith("/folders/") && folderId) {
      try {
        const folder = await getFolder(folderId); // accepts publicId or _id

        parentFolderId = folder._id;

        if (folder.path) {
          pathArray = folder.path.split("/").filter(Boolean);
        } else if (folder.name) {
          pathArray = [folder.name];
        }
      } catch (err) {
        console.error("Could not resolve current folder; uploading to root:", err);
      }
    }

    return { parentFolderId, pathArray };
  };



  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      const { parentFolderId, pathArray } =
        await resolveCurrentFolderForUploads();

      await uploadFiles(files, {
        folderId: parentFolderId || null, // null = My Drive root
        location: "My Drive",
        path: pathArray,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      alert(err.message || "Upload failed");
    } finally {
      e.target.value = ""; // reset so selecting same file works again
    }
  };




  const handleFolderSelected = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;

    try {
      const { parentFolderId, pathArray: basePath } =
        await resolveCurrentFolderForUploads();

      // cache: relPath ("Top/Sub") -> { folderId, pathArray }
      const folderCache = new Map();
      // empty path = "current view" (root or current folder)
      folderCache.set("", {
        folderId: parentFolderId || null,
        pathArray: basePath || [],
      });

      const ensureFolderForPath = async (relPathRaw) => {
        const relPath = (relPathRaw || "").replace(/\\/g, "/");

        if (!relPath || relPath === ".") {
          return folderCache.get("");
        }

        if (folderCache.has(relPath)) {
          return folderCache.get(relPath);
        }

        const segments = relPath.split("/").filter(Boolean);
        const parentRel = segments.slice(0, -1).join("/");
        const folderName = segments[segments.length - 1];

        // ensure parent exists first
        const parentInfo = await ensureFolderForPath(parentRel);

        const created = await createFolder({
          name: folderName,
          // createFolder accepts either publicId or _id; we pass _id
          parentFolder: parentInfo.folderId || null,
        });

        const createdPathArray = created.path
          ? created.path.split("/").filter(Boolean)
          : [...(parentInfo.pathArray || []), folderName];

        const info = { folderId: created._id, pathArray: createdPathArray };
        folderCache.set(relPath, info);
        return info;
      };

      // Process each file in the uploaded directory tree
      for (const file of fileList) {
        const rel = file.webkitRelativePath || file.relativePath || file.name;
        const normalized = rel.replace(/\\/g, "/");

        const dirPath = normalized.includes("/")
          ? normalized.substring(0, normalized.lastIndexOf("/"))
          : "";

        const folderInfo = await ensureFolderForPath(dirPath);

        await uploadFiles([file], {
          folderId: folderInfo.folderId || null,
          location: "My Drive",
          path: folderInfo.pathArray,
        });
      }
    } catch (err) {
      console.error("Folder upload failed:", err);
      alert(err.message || "Folder upload failed");
    } finally {
      e.target.value = "";
    }
  };




  const sideItems = [
    { id: "home", label: "Home", path: "/", icon: <HomeOutlinedIcon />, activeIcon: <HomeFilledIcon color="primary" /> },
    { id: "drive", label: "My Drive", path: "/mydrive", icon: <DriveFileMoveOutlinedIcon />, activeIcon: <DriveFileMoveOutlinedIcon color="primary" /> },
    { id: "shared", label: "Shared with me", path: "/shared", icon: <PeopleAltOutlinedIcon />, activeIcon: <PeopleAltIcon color="primary" /> },
    { id: "starred", label: "Starred", path: "/starred", icon: <StarBorderOutlinedIcon />, activeIcon: <StarIcon color="primary" /> },
    { id: "bin", label: "Trash", path: "/bin", icon: <DeleteOutlinedIcon />, activeIcon: <DeleteIcon color="primary" /> },
    { id: "storage", label: `Storage (${usedStorage}% full)`, icon: <CloudOutlinedIcon />, activeIcon: <WbCloudyIcon color="primary" /> },

  ];

  const getStorageColor = (usage) => {
    if (usage < 60) return "#0b57d0";
    if (usage < 85) return "#e59800";
    return "#d93025";
  };

  const sidebarContent = (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        sx={{
          backgroundColor: "#fff",
          color: "#1c1d20ff",
          borderRadius: "15px",
          justifyContent: "flex-start",
          textTransform: "none",
          fontWeight: 540,
          fontSize: 15,
          py: 2,
          px: 2.7,
          mb: 2.5,
          width: "fit-content",
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.25)",
          "&:hover": {
            backgroundColor: "#edf1fa",
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
          },
        }}
        onClick={handleOpenNewMenu}
        aria-controls={newMenuEl ? 'new-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={newMenuEl ? 'true' : undefined}
      >
        New
      </Button>

      <Menu
        id="new-menu"
        anchorEl={newMenuEl}
        open={Boolean(newMenuEl)}
        onClose={handleCloseNewMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={() => { handleCloseNewMenu(); handleCreateFolder(); }}>
          <ListItemIcon>
            <CreateNewFolderOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="New folder" />
        </MenuItem>
        <MenuItem disabled={uploading} onClick={() => { handleCloseNewMenu(); triggerFileUpload(); }}>
          <ListItemIcon>
            <UploadFileOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Upload file" />
        </MenuItem>
        <MenuItem disabled={uploading} onClick={() => { handleCloseNewMenu(); triggerFolderUpload(); }}>
          <ListItemIcon>
            <DriveFolderUploadOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Folder upload" />
        </MenuItem>
      </Menu>
      <input type="file" hidden multiple ref={fileInputRef} onChange={handleFilesSelected} />
      <input type="file" hidden multiple webkitdirectory="true" directory="" ref={folderInputRef} onChange={handleFolderSelected} />

      {uploading && (
        <Typography
          variant="caption"
          sx={{ color: "#1a73e8", ml: 1, mb: 1.5, display: "inline-block" }}
        >
          Uploading files...
        </Typography>
      )}

      <List>
        {sideItems.map((item) => {
          const isStorageItem = item.id === "storage";
          const isActiveItem = active === item.id;
          if (item.type === "spacer") {
            return <Box key={item.id} sx={{ height: 16 }} />
          }

          const baseSx = {
            alignSelf: 'flex-start',
            width: 'fit-content',
            borderRadius: '999px',
            ml: 0.5,
            mr: 1,
            px: 1.25,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            pr: 1.25,
          };

          const interactiveSx = {
            ...baseSx,
            color: isActiveItem ? '#0b57d0' : '#202124',
            bgcolor: isActiveItem ? '#c2e7ff' : 'transparent',
            pr: isActiveItem ? 3 : 1.25,
            "&:hover": {
              bgcolor: isActiveItem ? '#c2e7ff' : '#f1f3f4',
            },
          };

          const storageSx = {
            ...baseSx,
            color: '#202124',
            bgcolor: 'transparent',
            cursor: 'default',
          };

          const Container = isStorageItem ? Box : ListItemButton;
          const containerProps = {
            sx: isStorageItem ? storageSx : interactiveSx,
            onClick: isStorageItem
              ? undefined
              : () => {
                setActive(item.id);
                if (item.path) navigate(item.path);
                if (isMobile && onDrawerToggle) onDrawerToggle();
              },
          };

          return (
            <Box key={item.id} sx={{
              px: 0.8,
            }}>
              <Container
                {...containerProps}
              >
                {/* Left arrow toggle for expandable items */}
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.id === 'drive') setOpenDrive((v) => !v);
                    if (item.id === 'computers') setOpenComputers((v) => !v);
                  }}
                  sx={{
                    display: (item.id === 'drive' || item.id === 'computers') ? 'flex' : 'none',
                    alignItems: 'center',
                    pr: 0.5,
                    color: active === item.id ? '#0b57d0' : '#5f63g8',
                    cursor: 'pointer',
                  }}
                >
                  {(item.id === 'drive' && openDrive) || (item.id === 'computers' && openComputers)
                    ? <KeyboardArrowDownIcon fontSize="small" />
                    : <KeyboardArrowRightIcon fontSize="small" />}
                </Box>

                <ListItemIcon sx={{
                  minWidth: 36,
                  color: active === item.id ? "#c2e7ff" : "#5f63g8",
                }}
                >
                  {active === item.id ? item.activeIcon : item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: active === item.id ? 540 : 400,
                  }}
                />
              </Container>
              {/* Collapsible submenu for Drive */}
              {item.id === 'drive' && (
                <Collapse in={openDrive} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    <ListItemButton sx={{
                      alignSelf: 'flex-start',
                      width: 'fit-content',
                      borderRadius: '999px',
                      ml: 4.5,
                      mr: 1,
                      px: 1.25,
                      fontSize: 14,
                      color: '#202124',
                      bgcolor: 'transparent',
                      '&:hover': { bgcolor: '#f1f3f4' },
                    }}>
                      <ListItemText primary="My Files" primaryTypographyProps={{ fontWeight: 400 }} />
                    </ListItemButton>
                    <ListItemButton sx={{
                      alignSelf: 'flex-start',
                      width: 'fit-content',
                      borderRadius: '999px',
                      ml: 4.5,
                      mr: 1,
                      px: 1.25,
                      fontSize: 14,
                      color: '#202124',
                      bgcolor: 'transparent',
                      '&:hover': { bgcolor: '#f1f3f4' },
                    }}>
                      <ListItemText primary="Shared drives" primaryTypographyProps={{ fontWeight: 400 }} />
                    </ListItemButton>
                  </List>
                </Collapse>
              )}

              {/* Collapsible submenu for Computers */}
              {item.id === 'computers' && (
                <Collapse in={openComputers} timeout="auto" unmountOnExit>
                  {connectedDevices.length > 0 && (
                    <List disablePadding>
                      {connectedDevices.map((dev) => (
                        <ListItemButton key={dev.id || dev.name} sx={{
                          alignSelf: 'flex-start',
                          width: 'fit-content',
                          borderRadius: '999px',
                          ml: 4.5,
                          mr: 1,
                          px: 1.25,
                          fontSize: 14,
                          color: '#202124',
                          bgcolor: 'transparent',
                          '&:hover': { bgcolor: '#f1f3f4' },
                        }}>
                          <ListItemText primary={dev.name} primaryTypographyProps={{ fontWeight: 400 }} />
                        </ListItemButton>
                      ))}
                    </List>
                  )}
                </Collapse>
              )}

            </Box>
          );
        })}

      </List>


      <Box sx={{ px: 0.8 }}>
        <Box sx={{ ml: 0.5, mr: 1, pl: 1.25 }}>
          <LinearProgress
            variant="determinate"
            value={usedStorage}
            sx={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              mb: 0.5,
              bgcolor: "#e0e0e0",
              "& .MuiLinearProgress-bar": {
                bgcolor: getStorageColor(usedStorage)
              },
            }}
          />
        </Box>
      </Box>

      <Box sx={{ px: 0.8 }}>
        <Box sx={{ ml: 0.5, mr: 1, pl: 1.25 }}>
          <Typography variant="caption" color="text.secondary">
            {storageSummary}
          </Typography>
        </Box>
      </Box>

      <NewFolderDialog
        open={newFolderDialogOpen}
        onClose={() => setNewFolderDialogOpen(false)}
        onSubmit={handleSidebarCreateFolderSubmit}
      />
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250, bgcolor: "#f8fafd", p: 1.8, mt: 7.5 },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Box
      sx={{
        width,
        height: "100vh",
        bgcolor: "#f8fafd",
        display: { xs: 'none', md: 'flex' },
        flexDirection: "column",
        p: 1.8,
        boxSizing: "border-box",
        position: "relative",
        transition: "width 0.1s linear",
        mt: 7.5,
      }}

    >
      {sidebarContent}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "4px",
          height: "100%",
          cursor: "col-resize",
          touchAction: "none",
          "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
        }}
        onMouseDown={handleMouseDown}
      />

    </Box>
  );




};


export default Sidebar;

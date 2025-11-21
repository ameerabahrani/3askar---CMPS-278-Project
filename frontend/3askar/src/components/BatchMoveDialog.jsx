import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Breadcrumbs,
  Link,
  CircularProgress,
  TextField,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import apiClient from "../services/apiClient";

const BatchMoveDialog = ({ open, onClose, onMove, selectedCount }) => {
  const [currentFolderId, setCurrentFolderId] = useState(null); // null root
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: "My Drive" }]);
  const folderCacheRef = useRef(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchDebounceRef = useRef();
  const [breadcrumbLoading, setBreadcrumbLoading] = useState(false);

  // Fetch folder list with cache
  const fetchFolders = useCallback(async (parentId) => {
    const cacheKey = parentId || null;
    if (folderCacheRef.current.has(cacheKey)) {
      setFolders(folderCacheRef.current.get(cacheKey));
    } else {
      setFolders([]);
    }
    setLoading(true);
    try {
      const params = parentId ? { parentFolder: parentId } : {};
      const { data } = await apiClient.get("/folders", { params });
      const list = Array.isArray(data) ? data : [];
      folderCacheRef.current.set(cacheKey, list);
      setFolders(list);
    } catch (_) {
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBreadcrumb = useCallback(async (folderId) => {
    if (!folderId) {
      setBreadcrumbs([{ id: null, name: "My Drive" }]);
      return;
    }
    setBreadcrumbLoading(true);
    try {
      const { data } = await apiClient.get(`/folders/${folderId}/breadcrumb`);
      if (Array.isArray(data) && data.length) {
        const mapped = data.map(item => ({ id: item.publicId || item._id, name: item.name }));
        setBreadcrumbs(mapped.map(b => ({ id: b.id ?? null, name: b.name })));
      }
    } catch (_) {
      // silent
    } finally {
      setBreadcrumbLoading(false);
    }
  }, []);

  // Load folders when open or currentFolderId changes
  useEffect(() => {
    if (open) {
      fetchFolders(currentFolderId);
    } else {
      setCurrentFolderId(null);
      setBreadcrumbs([{ id: null, name: "My Drive" }]);
      setSearchTerm("");
      setSearchResults([]);
    }
  }, [open, currentFolderId, fetchFolders]);

  // Debounced folder search
  useEffect(() => {
    if (!open) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await apiClient.get("/folders/search", { params: { q: searchTerm.trim() } });
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (_) {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchTerm, open]);

  const handleFolderClick = (folder) => {
    const nextId = folder.publicId || folder._id;
    if (nextId === currentFolderId) return;
    setCurrentFolderId(nextId);
    setBreadcrumbs(prev => {
      const last = prev[prev.length - 1];
      if (last && last.id === nextId) return prev;
      return [...prev, { id: nextId, name: folder.name }];
    });
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleBreadcrumbClick = (index) => {
    const target = breadcrumbs[index];
    if (!target) return;
    if (target.id === currentFolderId) return;
    setCurrentFolderId(target.id);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleBack = () => {
    if (breadcrumbs.length > 1) {
      handleBreadcrumbClick(breadcrumbs.length - 2);
    }
  };

  const handleSearchSelect = async (folder) => {
    const nextId = folder.publicId || folder._id;
    setCurrentFolderId(nextId);
    await fetchBreadcrumb(nextId);
    setSearchTerm("");
    setSearchResults([]);
  };

  const renderFolderList = () => {
    if (searchTerm.trim().length >= 2) {
      if (searchLoading) {
        return (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        );
      }
      if (searchResults.length === 0) {
        return (
          <Typography sx={{ p: 2, color: "text.secondary", textAlign: "center" }}>
            No matches
          </Typography>
        );
      }
      return (
        <List>
          {searchResults.map(folder => (
            <ListItemButton key={folder._id} onClick={() => handleSearchSelect(folder)} sx={{ borderRadius: 1 }}>
              <ListItemIcon>
                <FolderIcon sx={{ color: "#5f6368" }} />
              </ListItemIcon>
              <ListItemText primary={folder.name} />
            </ListItemButton>
          ))}
        </List>
      );
    }
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }
    if (folders.length === 0) {
      return (
        <Typography sx={{ p: 2, color: "text.secondary", textAlign: "center" }}>
          No folders here
        </Typography>
      );
    }
    return (
      <List>
        {folders.map(folder => (
          <ListItemButton key={folder._id} onClick={() => handleFolderClick(folder)} sx={{ borderRadius: 1 }}>
            <ListItemIcon>
              <FolderIcon sx={{ color: "#5f6368" }} />
            </ListItemIcon>
            <ListItemText primary={folder.name} />
          </ListItemButton>
        ))}
      </List>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Move {selectedCount} item{selectedCount !== 1 ? "s" : ""} to...
        {breadcrumbLoading ? (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>Loading path...</Typography>
        ) : (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
            Path: {breadcrumbs.map(b => b.name).join(' / ')}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ height: "400px", display: "flex", flexDirection: "column" }}>
        <Box sx={{ mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchLoading && (
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>Searching...</Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
          {breadcrumbs.length > 1 && (
            <IconButton size="small" onClick={handleBack}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Breadcrumbs maxItems={4} aria-label="breadcrumb">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return isLast ? (
                <Typography key={crumb.id || index} color="text.primary" sx={{ fontWeight: 500 }}>
                  {crumb.name}
                </Typography>
              ) : (
                <Link
                  key={crumb.id || index}
                  component="button"
                  underline="hover"
                  color="inherit"
                  onClick={() => handleBreadcrumbClick(index)}
                >
                  {crumb.name}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Box>
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {renderFolderList()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => onMove(currentFolderId)}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          Move Here
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchMoveDialog;

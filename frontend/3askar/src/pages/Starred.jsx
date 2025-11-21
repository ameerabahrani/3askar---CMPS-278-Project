import React from "react";
import { Box, Typography, IconButton, Menu, MenuItem, Checkbox } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import StarIcon from "@mui/icons-material/Star";
import MenuBar from "../components/MenuBar";
import BatchToolbar from "../components/BatchToolbar";
import { useFiles } from "../context/fileContext.jsx";
import FileKebabMenu from "../components/FileKebabMenu.jsx";
import { isFolder } from "../utils/fileHelpers";
import { getRowStyles } from "../styles/selectionTheme";

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString();
};

function Starred() {
  const {
    filteredFiles,
    filterBySource,
    loading,
    error,
    selectedFiles,
    selectedFolders,
    toggleFileSelection,
    toggleFolderSelection,
    clearSelection,
    selectAll,
    starredFiles: contextStarredFiles,
  } = useFiles();

  const [sortField, setSortField] = React.useState("name");
  const [sortDirection, setSortDirection] = React.useState("asc");
  const [menuEl, setMenuEl] = React.useState(null);

  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [menuPosition, setMenuPosition] = React.useState(null);
  const [selectedFile, setSelectedFile] = React.useState(null);

  const menuOpen = Boolean(menuAnchorEl) || Boolean(menuPosition);

  const anchorPosition = menuPosition
    ? { top: menuPosition.mouseY, left: menuPosition.mouseX }
    : undefined;

  const handleMenuButtonClick = (event, file) => {
    event.stopPropagation?.();
    setSelectedFile(file);
    setMenuPosition(null);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleContextMenu = (event, file) => {
    event.preventDefault();
    event.stopPropagation?.();
    setSelectedFile(file);
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

  React.useEffect(() => {
    clearSelection();
  }, [clearSelection]);


  const starredFiles = React.useMemo(
    () => {
      // If we have starredFiles from context (which includes folders), use it.
      // But we also need to make sure we don't duplicate if filterBySource also returns them?
      // Actually, filterBySource(undefined, "starred") uses pickSourceList("starred") which uses combinedFiles.
      // combinedFiles in fileContext now needs to include starredFiles?
      // Let's check fileContext again. 
      // I didn't update combinedFiles to include starredFiles.
      // So filterBySource won't see starred folders unless I update combinedFiles OR I just use starredFiles directly here.
      // Using starredFiles directly is safer if I expose it.
      // I exposed starredFiles in fileContext.
      return contextStarredFiles || [];
    },
    [contextStarredFiles]
  );

  const sortedFiles = React.useMemo(() => {
    return [...starredFiles].sort((a, b) => {
      const valueA =
        sortField === "date"
          ? Number(new Date(a.lastAccessedAt || a.uploadedAt || a.date))
          : (a[sortField] ?? "").toString().toLowerCase();

      const valueB =
        sortField === "date"
          ? Number(new Date(b.lastAccessedAt || b.uploadedAt || b.date))
          : (b[sortField] ?? "").toString().toLowerCase();

      if (sortDirection === "asc") return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    });
  }, [starredFiles, sortField, sortDirection]);

  const selectedCount = React.useMemo(
    () => sortedFiles.reduce((acc, f) => {
      const isFolderItem = isFolder(f);
      const set = isFolderItem ? selectedFolders : selectedFiles;
      return set.has(f.id) ? acc + 1 : acc;
    }, 0),
    [sortedFiles, selectedFiles, selectedFolders]
  );
  const allSelected = selectedCount > 0 && selectedCount === sortedFiles.length;
  const someSelected = selectedCount > 0 && selectedCount < sortedFiles.length;

  const handleHeaderToggle = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(sortedFiles);
    }
  };

  const isItemSelected = (file) => {
    const isFolderItem = isFolder(file);
    return (isFolderItem ? selectedFolders : selectedFiles).has(file.id);
  };

  const toggleSelectionFor = (file) => {
    const isFolderItem = isFolder(file);
    if (isFolderItem) toggleFolderSelection(file.id); else toggleFileSelection(file.id);
  };

  const handleOpenMenu = (event) => setMenuEl(event.currentTarget);
  const handleCloseMenu = () => setMenuEl(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ^" : " v";
  };

  if (loading) {
    return <Typography sx={{ p: 2 }}>Loading starred items...</Typography>;
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
        color: "#000000ff",
        borderTopLeftRadius: 12,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Starred
      </Typography>

      {selectedCount > 0 ? <BatchToolbar visibleItems={sortedFiles} /> : <MenuBar visibleFiles={sortedFiles} />}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 1,
          mt: 2,
          borderBottom: "1px solid #e0e0e0",
          fontWeight: 500,
          fontSize: 14,
          color: "#5f6368",
          cursor: "pointer",
        }}
      >
        <Box sx={{ width: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Checkbox
            size="small"
            indeterminate={someSelected && !allSelected}
            checked={allSelected}
            onChange={handleHeaderToggle}
          />
        </Box>
        <Box sx={{ flex: 4 }} onClick={() => handleSort("name")}>
          Name{renderSortIndicator("name")}
        </Box>

        <Box sx={{ flex: 3 }} onClick={() => handleSort("owner")}>
          Owner{renderSortIndicator("owner")}
        </Box>

        <Box sx={{ flex: 2 }} onClick={() => handleSort("date")}>
          Date starred{renderSortIndicator("date")}
        </Box>

        <Box sx={{ width: 40 }} />
      </Box>

      {sortedFiles.map((file) => {
        const selected = isItemSelected(file);
        return (
          <Box
            key={file.id}
            onContextMenu={(e) => handleContextMenu(e, file)}
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2,
              py: 1.5,
              borderBottom: "1px solid #f1f3f4",
              ...getRowStyles(selected),
            }}
          >
            <Box sx={{ width: 40, display: "flex", justifyContent: "center" }}>
              <Checkbox
                size="small"
                checked={selected}
                onChange={(e) => { e.stopPropagation(); toggleSelectionFor(file); }}
              />
            </Box>
            <Box sx={{ flex: 4, display: "flex", alignItems: "center", gap: 1.5 }}>
              <StarIcon sx={{ color: "#f7cb4d", fontSize: 20 }} />
              <img src={file.icon} width={20} height={20} alt="file icon" />
              {file.name}
            </Box>

            <Box sx={{ flex: 3, color: "#5f6368" }}>
              {file.owner || "Unknown"}
            </Box>

            <Box sx={{ flex: 2, color: "#5f6368" }}>
              {formatDate(file.lastAccessedAt || file.uploadedAt)}
            </Box>

            <IconButton onClick={(event) => handleMenuButtonClick(event, file)}>
              <MoreVertIcon sx={{ color: "#5f6368" }} />
            </IconButton>

          </Box>
        );
      })}

      <FileKebabMenu
        anchorEl={menuAnchorEl}
        anchorPosition={anchorPosition}
        open={menuOpen}
        onClose={handleMenuClose}
        selectedFile={selectedFile}
      />
    </Box>
  );
}

export default Starred;



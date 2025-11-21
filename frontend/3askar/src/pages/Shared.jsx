import React from "react";
import { Box, Typography, IconButton, Checkbox } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuBar from "../components/MenuBar";
import BatchToolbar from "../components/BatchToolbar";
import { useFiles } from "../context/fileContext.jsx";
import HoverActions from "../components/HoverActions.jsx";
import FileKebabMenu from "../components/FileKebabMenu";
import RenameDialog from "../components/RenameDialog";
import ShareDialog from "../components/ShareDialog.jsx";
import DetailsPanel from "../components/DetailsPanel.jsx";
import FileKebabMenu from "../components/FileKebabMenu.jsx";
import { isFolder } from "../utils/fileHelpers";
import { getRowStyles } from "../styles/selectionTheme";

const DEFAULT_FILE_ICON =
  "https://www.gstatic.com/images/icons/material/system/2x/insert_drive_file_black_24dp.png";

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString();
};

const getSortValue = (file, field) => {
  switch (field) {
    case "name":
      return file.name || "";
    case "owner":
      return file.owner || "";
    case "date":
      return file.lastAccessedAt || file.uploadedAt || "";
    default:
      return "";
  }
};

function Shared() {
 const {
    filteredFiles,
    loading,
    error,
    filterBySource,
    toggleStar,
    renameFile,
    downloadFile,
    canRename,
    selectedFiles,
    selectedFolders,
    toggleFileSelection,
    toggleFolderSelection,
    clearSelection,
    selectAll,
  } = useFiles();
  
  const [sortField, setSortField] = React.useState("name");
  const [sortDirection, setSortDirection] = React.useState("asc");

  // Dialog states
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [fileToRename, setFileToRename] = React.useState(null);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [fileToShare, setFileToShare] = React.useState(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = React.useState(false);
  const [detailsFile, setDetailsFile] = React.useState(null);

  // Menu state
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


  const sharedFiles = React.useMemo(
    () => filterBySource(undefined, "shared"),
    [filterBySource]
  );

  const sortedFiles = React.useMemo(() => {
    const data = [...sharedFiles];
    data.sort((a, b) => {
      const valueA = getSortValue(a, sortField);
      const valueB = getSortValue(b, sortField);

      if (sortField === "date") {
        const timeA = Number(new Date(valueA));
        const timeB = Number(new Date(valueB));
        if (sortDirection === "asc") {
          return (Number.isNaN(timeA) ? 0 : timeA) - (Number.isNaN(timeB) ? 0 : timeB);
        }
        return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
      }

      const textA = valueA?.toString().toLowerCase() ?? "";
      const textB = valueB?.toString().toLowerCase() ?? "";
      if (textA < textB) return sortDirection === "asc" ? -1 : 1;
      if (textA > textB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [sharedFiles, sortField, sortDirection]);

  // Handlers
  const openMenu = (event, file) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedFile(file);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
    setSelectedFile(null);
  };

  const openShareDialog = (file) => {
    setFileToShare(file);
    setShareDialogOpen(true);
  };

  const openRenameDialog = (file) => {
    setFileToRename(file);
    setRenameDialogOpen(true);
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
    return <Typography sx={{ p: 2 }}>Loading shared files...</Typography>;
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
        Shared with me
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
          Shared by{renderSortIndicator("owner")}
        </Box>

        <Box sx={{ flex: 2 }} onClick={() => handleSort("date")}>
          Date shared{renderSortIndicator("date")}
        </Box>

        <Box sx={{ width: 40 }} />
      </Box>

      {!sortedFiles.length ? (
        <Typography sx={{ px: 2, py: 3, color: "#5f6368" }}>
          Nothing has been shared with you yet.
        </Typography>
      ) : (
          {/* FILE ROWS WITH HOVER MENU + BATCH MODE */}
          {sortedFiles && sortedFiles.length > 0 && (
            sortedFiles.map((file) => {
              const selected = isItemSelected(file);

              return (
                <HoverActions
                  key={file.id}
                  file={file}
                  toggleStar={toggleStar}
                  openShareDialog={openShareDialog}
                  showShare={!isBatchMode}               // 🚫 hide share in batch mode
                  openRenameDialog={openRenameDialog}
                  openMenu={(e) => handleMenuButtonClick(e, file)}
                  downloadFile={downloadFile}
                  copyFile={copyFile}
                  formatDate={formatDate}
                  showRename={!isBatchMode && canRename(file)}    // 🚫 no rename when batch
                  disabled={isBatchMode}                 // 🚫 disable hover actions in batch
                  renderContent={(f) => (
                    <Box
                      onContextMenu={(e) => handleContextMenu(e, f)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        px: 2,
                        py: 1.5,
                        borderBottom: "1px solid #f1f3f4",
                        ...getRowStyles(selected),
                      }}
                    >
                      {/* Checkbox ALWAYS visible */}
                      <Box sx={{ width: 40, display: "flex", justifyContent: "center" }}>
                        <Checkbox
                          size="small"
                          checked={selected}
                          onChange={(e) => { e.stopPropagation(); toggleSelectionFor(file); }}
                        />
                      </Box>

                      {/* File Icon + Name */}
                      <Box sx={{ flex: 4, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <img
                          src={f.icon || DEFAULT_FILE_ICON}
                          width={20}
                          height={20}
                          alt="file icon"
                        />
                        {f.name}
                      </Box>

                      {/* Owner */}
                      <Box sx={{ flex: 3, color: "#5f6368" }}>
                        {f.owner || "Unknown"}
                      </Box>

                      {/* Date */}
                      <Box sx={{ flex: 2, color: "#5f6368" }}>
                        {formatDate(f.lastAccessedAt || f.uploadedAt)}
                      </Box>

                      {/* Kebab Icon ONLY in single mode */}
                      {!isBatchMode && (
                        <IconButton onClick={(event) => handleMenuButtonClick(event, f)}>
                          <MoreVertIcon sx={{ color: "#5f6368" }} />
                        </IconButton>
                      )}
                    </Box>
                  )}
                />
              );
            })
          )}

          {/* FILE KEBAB MENU */}
          <FileKebabMenu
            anchorEl={menuAnchorEl}
            anchorPosition={anchorPosition}
            open={menuOpen}
            onClose={handleMenuClose}
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
          />

          {/* DETAILS PANEL */}
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

          {/* RENAME DIALOG */}
          <RenameDialog
            open={renameDialogOpen}
            file={fileToRename}
            onClose={() => {
              setRenameDialogOpen(false);
              setFileToRename(null);
            }}
            onSubmit={(newName) => {
              renameFile(fileToRename.id, newName);
              setRenameDialogOpen(false);
              setFileToRename(null);
            }}
          />

          {/* SHARE DIALOG */}
          <ShareDialog
            open={shareDialogOpen}
            file={fileToShare}
            onClose={() => {
              setShareDialogOpen(false);
              setFileToShare(null);
            }}
          />

      />
    </Box>
  );
}

export default Shared;



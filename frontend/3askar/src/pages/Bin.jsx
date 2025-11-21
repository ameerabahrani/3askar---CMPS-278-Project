import React from "react";
import { Box, Typography, IconButton, Menu, MenuItem, Checkbox } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuBar from "../components/MenuBar";
import BatchToolbar from "../components/BatchToolbar";
import { useFiles } from "../context/fileContext.jsx";
import HoverActions from "../components/HoverActions.jsx";
import ShareDialog from "../components/ShareDialog.jsx";
import { isFolder } from "../utils/fileHelpers";
import { getRowStyles } from "../styles/selectionTheme";

const DEFAULT_FILE_ICON =
  "https://www.gstatic.com/images/icons/material/system/2x/insert_drive_file_black_24dp.png";

const formatDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString();
};

const getSortValue = (file, field) => {
  switch (field) {
    case "name":
      return file.name || "";
    case "owner":
      return file.owner || "";
    case "originalLocation":
      return file.location || "My Drive";
    case "dateDeleted":
      return file.deletedAt || file.lastAccessedAt || file.uploadedAt || "";
    default:
      return "";
  }
};

function Bin() {
  const {
    loading,
    error,
    restoreFromBin,
    deleteForever,
    filterBySource,
    toggleStar,
    downloadFile,
    selectedFiles,
    selectedFolders,
    toggleFileSelection,
    toggleFolderSelection,
    clearSelection,
    selectAll,
  } = useFiles();

  const [sortField, setSortField] = React.useState("name");
  const [sortDirection, setSortDirection] = React.useState("asc");
  const [menuEl, setMenuEl] = React.useState(null);
  const [activeFile, setActiveFile] = React.useState(null);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [fileToShare, setFileToShare] = React.useState(null);

  const deletedFiles = React.useMemo(
    () => filterBySource(undefined, "trash"),
    [filterBySource]
  );

  const sortedFiles = React.useMemo(() => {
    const data = [...deletedFiles];

    data.sort((a, b) => {
      const valueA = getSortValue(a, sortField);
      const valueB = getSortValue(b, sortField);

      if (sortField === "dateDeleted") {
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
  }, [deletedFiles, sortField, sortDirection]);

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

  const handleOpenMenu = (event, file) => {
    event.stopPropagation?.();
    setMenuEl(event.currentTarget);
    setActiveFile(file);
  };

  const handleCloseMenu = () => {
    setMenuEl(null);
    setActiveFile(null);
  };

  React.useEffect(() => {
    clearSelection();
  }, [clearSelection]);

  const handleRestore = () => {
    if (activeFile) {
      restoreFromBin(activeFile.id);
    }
    handleCloseMenu();
  };

  const handleDeleteForever = () => {
    if (activeFile) {
      deleteForever(activeFile.id);
    }
    handleCloseMenu();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const openShareDialog = (file) => {
    setFileToShare(file);
    setShareDialogOpen(true);
  };

  const closeShareDialog = () => {
    setShareDialogOpen(false);
    setFileToShare(null);
  };


  const renderSortIndicator = (field) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ^" : " v";
  };

  if (loading) {
    return <Typography sx={{ p: 2 }}>Loading trash...</Typography>;
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
        Trash
      </Typography>

      {selectedCount > 0 ? <BatchToolbar toolbarSource="trash" visibleItems={sortedFiles} /> : <MenuBar visibleFiles={sortedFiles} />}

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

        <Box sx={{ flex: 2 }} onClick={() => handleSort("originalLocation")}>
          Original location{renderSortIndicator("originalLocation")}
        </Box>

        <Box sx={{ flex: 1 }} onClick={() => handleSort("dateDeleted")}>
          Date deleted{renderSortIndicator("dateDeleted")}
        </Box>

        <Box sx={{ width: 40 }} />
      </Box>

      {!sortedFiles.length ? (
        <Typography sx={{ px: 2, py: 3, color: "#5f6368" }}>
          Bin is empty.
        </Typography>
      ) : (
          sortedFiles.map((file) => {
            const selected = isItemSelected(file);
            return (
              <HoverActions
                key={file.id}
                file={file}
                toggleStar={toggleStar}
                openShareDialog={openShareDialog}
                showShare={true}
                openRenameDialog={openRenameDialog}
                openMenu={openMenu}
                downloadFile={downloadFile}
                formatDate={formatDate}
                showRename={canRename(file)}
                renderContent={(f) => (
                  <>
                    <Box
                      sx={{ width: 40, display: "flex", justifyContent: "center" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        size="small"
                        checked={selected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectionFor(file);
                        }}
                      />
                    </Box>

                    <Box sx={{ flex: 4, display: "flex", alignItems: "center", gap: 1.5 }}>
                      <img
                        src={f.icon || DEFAULT_FILE_ICON}
                        width={20}
                        height={20}
                        alt="file icon"
                      />
                      {f.name}
                    </Box>

                    <Box sx={{ flex: 3, color: "#5f6368" }}>
                      {f.owner || "Unknown"}
                    </Box>

                    <Box sx={{ flex: 2, color: "#5f6368" }}>
                      {formatDate(f.lastAccessedAt || f.uploadedAt)}
                    </Box>
                  </>
                )}
              />
            );
          })
        )}
      )}

      <Menu anchorEl={menuEl} open={Boolean(menuEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleRestore}>Restore</MenuItem>
        <MenuItem onClick={handleDeleteForever}>Delete forever</MenuItem>
      </Menu>
      <ShareDialog
        open={shareDialogOpen}
        file={fileToShare}
        onClose={closeShareDialog}
      />
    </Box>
  );
}

export default Bin;







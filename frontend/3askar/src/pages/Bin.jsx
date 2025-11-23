import React from "react";
import { Box, Typography, IconButton, Menu, MenuItem, Checkbox, Grid, Paper } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import FolderIcon from "@mui/icons-material/Folder";
import MenuBar from "../components/MenuBar";
import BatchToolbar from "../components/BatchToolbar";
import { useFiles } from "../context/fileContext.jsx";
import HoverActions from "../components/HoverActions.jsx";
import ShareDialog from "../components/ShareDialog.jsx";
import { isFolder } from "../utils/fileHelpers";
import { getRowStyles, getCardStyles, checkboxOverlayStyles } from "../styles/selectionTheme";

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
    filteredFiles,
    loading,
    error,
    restoreFromBin,
    deleteForever,
    filterBySource,
    selectedFiles,
    selectedFolders,
    toggleFileSelection,
    toggleFolderSelection,
    clearSelection,
    selectAll,
    toggleStar,
    downloadFile,
  } = useFiles();

  const [sortField, setSortField] = React.useState("name");
  const [sortDirection, setSortDirection] = React.useState("asc");
  const [viewMode, setViewMode] = React.useState("list");
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
        px: { xs: 2, md: 4 },
        pt: 3,
        pb: 6,
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

      {/* View Mode Toggle Buttons */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, mb: 1 }}>
        <IconButton
          size="small"
          onClick={() => setViewMode("list")}
          sx={{ color: viewMode === "list" ? "#1a73e8" : "#5f6368" }}
        >
          <ListIcon />
        </IconButton>
        <IconButton
          size="small"
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

            <Box sx={{ flex: 3, display: { xs: 'none', md: 'block' } }} onClick={() => handleSort("owner")}>
              Owner{renderSortIndicator("owner")}
            </Box>

            <Box sx={{ flex: 2, display: { xs: 'none', md: 'block' } }} onClick={() => handleSort("originalLocation")}>
              Original location{renderSortIndicator("originalLocation")}
            </Box>

            <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} onClick={() => handleSort("dateDeleted")}>
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
              const isFolderItem = isFolder(file);
              return (
                <Box
                  key={file.id}
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
                  <Box sx={{ flex: 1, display: "flex", width: "100%" }}>
                    <HoverActions
                      key={file.id}
                      file={file}
                      sx={{ flex: 1 }}
                      toggleStar={() => null} // no star in trash
                      openShareDialog={() => null} // no share in trash
                      openMenu={(e) => handleOpenMenu(e, file)}
                      downloadFile={() => { }}
                      formatDate={formatDate}
                      showRename={false}
                      renderContent={(file) => (
                        <>
                          <Box sx={{ flex: 4, display: "flex", alignItems: "center", gap: 1.5 }}>
                            {isFolder(file) ? (
                              <FolderIcon sx={{ fontSize: 24, color: "#5f6368" }} />
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

                          <Box sx={{ flex: 3, display: { xs: 'none', md: 'block' } }}>
                            <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                              {file.owner || "Unknown"}
                            </Typography>
                          </Box>

                          <Box sx={{ flex: 2, display: { xs: 'none', md: 'block' } }}>
                            <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                              {file.location || "My Drive"}
                            </Typography>
                          </Box>

                          <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}>
                            <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                              {formatDate(file.deletedAt || file.lastAccessedAt || file.uploadedAt)}
                            </Typography>
                          </Box>
                        </>
                      )}
                    />
                  </Box>
                </Box >
              );
            })
          )}
        </>
      ) : (
        /* GRID VIEW */
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {!sortedFiles.length ? (
            <Grid item xs={12}>
              <Typography sx={{ px: 2, py: 3, color: "#5f6368" }}>
                Bin is empty.
              </Typography>
            </Grid>
          ) : (
            sortedFiles.map((file) => {
              const selected = isItemSelected(file);
              const isFolderItem = isFolder(file);
              return (
                <Grid item xs={6} sm={4} md={3} lg={2} key={file.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      position: "relative",
                      borderRadius: 2,
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      ...getCardStyles(selected),
                    }}
                    onClick={() => { /* placeholder */ }}
                  >
                    {/* Grid view checkbox overlay */}
                    <Checkbox
                      size="small"
                      checked={selected}
                      onChange={(e) => { e.stopPropagation(); toggleSelectionFor(file); }}
                      sx={checkboxOverlayStyles}
                    />
                    <IconButton
                      size="small"
                      sx={{ position: "absolute", top: 4, right: 4, zIndex: 2 }}
                      onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, file); }}
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
                      {isFolderItem ? (
                        <FolderIcon sx={{ fontSize: 40, color: "#5f6368" }} />
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
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: 14,
                          mb: 0.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {file.name}
                      </Typography>
                      <Typography
                        sx={{
                          color: "#5f6368",
                          fontSize: 12,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {file.location || "My Drive"}
                      </Typography>
                      <Typography sx={{ color: "#5f6368", fontSize: 12 }}>
                        {formatDate(file.deletedAt || file.lastAccessedAt || file.uploadedAt)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              );
            })
          )}
        </Grid>
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

    </Box >
  );
}

export default Bin;







import React from "react";
import { Box, Typography, IconButton, Checkbox } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FolderIcon from "@mui/icons-material/Folder";
import MenuBar from "../components/MenuBar";
import BatchToolbar from "../components/BatchToolbar";
import { useFiles } from "../context/fileContext.jsx";
import FileKebabMenu from "../components/FileKebabMenu.jsx";
import { isFolder } from "../utils/fileHelpers";
import { getRowStyles } from "../styles/selectionTheme";
import { useNavigate } from "react-router-dom";

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
    selectedFiles,
    selectedFolders,
    toggleFileSelection,
    toggleFolderSelection,
    clearSelection,
    selectAll,
  } = useFiles();

  const navigate = useNavigate();
  const [sortField, setSortField] = React.useState("name");
  const [sortDirection, setSortDirection] = React.useState("asc");
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

  const handleItemClick = (file) => {
    if (isFolder(file)) {
      navigate(`/folders/${file.id}`);
    }
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
        sortedFiles.map((file) => {
          const selected = isItemSelected(file);
          const isFolderItem = isFolder(file);
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
                cursor: isFolderItem ? "pointer" : "default",
              }}
              onClick={() => handleItemClick(file)}
            >
              <Box sx={{ width: 40, display: "flex", justifyContent: "center" }}>
                <Checkbox
                  size="small"
                  checked={selected}
                  onChange={(e) => { e.stopPropagation(); toggleSelectionFor(file); }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Box>
              <Box sx={{ flex: 4, display: "flex", alignItems: "center", gap: 1.5 }}>
                {isFolderItem ? (
                  <FolderIcon sx={{ color: "#5f6368", fontSize: 20 }} />
                ) : (
                  <img
                    src={file.icon || DEFAULT_FILE_ICON}
                    width={20}
                    height={20}
                    alt="file icon"
                  />
                )}
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
        })
      )}

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

export default Shared;



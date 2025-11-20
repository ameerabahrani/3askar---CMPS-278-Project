import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import MenuBar from "../components/MenuBar";
import { useFiles } from "../context/fileContext.jsx";
import HoverActions from "../components/HoverActions.jsx";
import FileKebabMenu from "../components/FileKebabMenu";
import RenameDialog from "../components/RenameDialog";
import ShareDialog from "../components/ShareDialog.jsx";
import DetailsPanel from "../components/DetailsPanel.jsx";

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
  const { filteredFiles, loading, error, filterBySource, toggleStar, renameFile, downloadFile, canRename } = useFiles();

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
  const [selectedFile, setSelectedFile] = React.useState(null);

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
    return sortDirection === "asc" ? " ↑" : " ↓";
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

      <MenuBar visibleFiles={sortedFiles} />

      <Box
        sx={{
          display: "flex",
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
        sortedFiles.map((file) => (
          <HoverActions
            key={file.id}
            file={file}
            toggleStar={toggleStar}
            openShareDialog={openShareDialog}
            openRenameDialog={openRenameDialog}
            openMenu={openMenu}
            downloadFile={downloadFile}
            formatDate={formatDate}
            showRename={canRename(file)}
            renderContent={(f) => (
              <>
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
        ))
      )}

      {/* FILE KEbab Menu */}
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

      {/* Rename Dialog */}
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

      {/* Share Dialog */}
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

export default Shared;

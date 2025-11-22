import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  MenuItem,
  Select,
  Avatar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import apiClient from "../services/apiClient";

function ShareDialog({ open, file, onClose }) {
  // ---------- HOOKS (always called, no conditions!) ----------
  const [email, setEmail] = React.useState("");
  const [permission, setPermission] = React.useState("read"); // "read" | "write"
  const [collaborators, setCollaborators] = React.useState([]);
  const [copied, setCopied] = React.useState(false);

  // ---------- DERIVED VALUES ----------
  // We treat "file" prop as: either a real file OR a folder we passed from Homepage
  const isFolder =
    !!file &&
    (file.__kind === "folder" ||
      file.isFolder === true ||
      (file.type && file.type.toLowerCase() === "folder"));

  const targetId = isFolder
    ? file?.publicId || file?._id
    : file?.id;

  const targetName =
    file?.name || file?.filename || "Untitled";

  // For now: keep your original behavior for files.
  // For folders we just generate a link to open that folder in the UI.
  const shareLink = React.useMemo(() => {
    if (!targetId || !file) return "";

    if (isFolder) {
      return `${window.location.origin}/folders/${file.publicId || file._id}`;
    }

    // file download link (original behavior)
    return `${window.location.origin}/files/${file.id}/download`;
  }, [file, isFolder, targetId]);

  // ---------- EFFECTS ----------
  // When a new file/folder is opened, load its collaborators
  React.useEffect(() => {
    if (file && Array.isArray(file.sharedWith)) {
      setCollaborators(file.sharedWith);
    } else {
      setCollaborators([]);
    }
  }, [file]);

  // Reset inputs when dialog closes
  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setPermission("read");
      setCopied(false);
    }
  }, [open]);

  // ---------- HELPERS ----------
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedEmail = email.trim();
  const isEmailValid = emailRegex.test(trimmedEmail);

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // ---------- ACTIONS ----------
  // 1) Add collaborator (file vs folder)
  const handleAddCollaborator = async () => {
    const raw = (email || "").trim();
    if (!raw) return;
    const normalized = raw.toLowerCase();

    try {
      // Find user by email (normalize casing)
      const res = await apiClient.get(
        `/user/find?email=${encodeURIComponent(normalized)}`
      );

      const user = res.data?.user;
      if (!user) {
        alert("This email does not belong to a registered 3askar user.");
        return;
      }

      // Attempt to share. Backend requires the current user to be the owner;
      // if not, the route will return 404 (File not found)
      try {
        await apiClient.patch(`/files/${file.id}/share`, {
          userId: user._id,
          permission,
        });

        // Update UI
        setCollaborators((prev) => [...prev, { user, permission }]);
        setEmail("");
        setPermission("read");
      } catch (shareErr) {
        const status = shareErr?.response?.status;
        const msg = shareErr?.response?.data?.message || "";
        if (status === 404 && /file not found/i.test(msg)) {
          alert("Unable to share: you must be the file owner to add collaborators.");
        } else if (status === 400) {
          alert(msg || "Invalid share request.");
        } else {
          console.error("Share error:", shareErr);
          alert(msg || "Failed to share file.");
        }
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        alert("This email does not belong to a registered 3askar user.");
      } else {
        console.error("Find user error:", err);
        alert("Unable to verify user right now.");
      }
    }
  };

  // 2) Change permission
  const handlePermissionChange = async (col, newPerm) => {
    if (!col?.user?._id || !targetId) return;

    try {
      if (isFolder) {
        await apiClient.patch(`/folders/${targetId}/permission`, {
          userId: col.user._id,
          canEdit: newPerm === "write",
        });

        setCollaborators((prev) =>
          prev.map((c) =>
            c.user._id === col.user._id
              ? { ...c, canEdit: newPerm === "write" }
              : c
          )
        );
      } else {
        await apiClient.patch(`/files/${targetId}/permission`, {
          userId: col.user._id,
          permission: newPerm,
        });

        setCollaborators((prev) =>
          prev.map((c) =>
            c.user._id === col.user._id
              ? { ...c, permission: newPerm }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Error updating permission:", err);
      alert("Failed to update permission.");
    }
  };

  // 3) Remove collaborator
  const handleRemove = async (col) => {
    if (!col?.user?._id || !targetId) return;

    try {
      if (isFolder) {
        await apiClient.patch(`/folders/${targetId}/unshare`, {
          userId: col.user._id,
        });
      } else {
        await apiClient.patch(`/files/${targetId}/unshare`, {
          userId: col.user._id,
        });
      }

      setCollaborators((prev) =>
        prev.filter((c) => c.user._id !== col.user._id)
      );
    } catch (err) {
      console.error("Error removing collaborator:", err);
      alert("Failed to remove collaborator.");
    }
  };

  // Derived list for rendering (normalize permission field)
  const collaboratorsForRender = collaborators
    .filter((col) => col.user && typeof col.user === "object" && col.user.email)
    .map((col) => ({
      raw: col,
      user: col.user,
      permValue: isFolder
        ? (col.canEdit ? "write" : "read")
        : col.permission || "read",
    }));

  // ---------- RENDER ----------
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
        {isFolder ? "Share folder" : "Share"} “{targetName}”
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Add collaborator */}
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            label="Add people by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            size="small"
            error={email.length > 0 && !isEmailValid}
            helperText={
              email.length > 0 && !isEmailValid
                ? "Enter a valid email address"
                : ""
            }
          />

          <Select
            value={permission}
            size="small"
            onChange={(e) => setPermission(e.target.value)}
            sx={{ width: 120 }}
          >
            <MenuItem value="read">Read</MenuItem>
            <MenuItem value="write">
              {isFolder ? "Can edit" : "Write"}
            </MenuItem>
          </Select>

          <Button
            variant="contained"
            disabled={!isEmailValid || !targetId}
            onClick={handleAddCollaborator}
          >
            Add
          </Button>
        </Box>

        {/* Optional: copy link (works for file + folder) */}
        {shareLink && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
              Link
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                value={shareLink}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
              />
              <Button variant="outlined" onClick={handleCopyLink}>
                {copied ? "Copied!" : "Copy link"}
              </Button>
            </Box>
          </Box>
        )}

        {/* Collaborators list */}
        <Typography sx={{ mb: 1, fontWeight: 600 }}>
          People with access
        </Typography>

        {collaboratorsForRender.length === 0 ? (
          <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
            No one else has access
          </Typography>
        ) : (
          collaboratorsForRender.map(({ raw, user, permValue }, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 2,
                p: 1,
                borderRadius: 2,
                "&:hover": { backgroundColor: "#f8f9fa" },
              }}
            >
              <Avatar sx={{ mr: 2 }}>
                {user.email?.charAt(0).toUpperCase() || "?"}
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ fontWeight: 500 }}>
                  {user.email || "Unknown User"}
                </Typography>
              </Box>

              <Select
                size="small"
                value={permValue}
                onChange={(e) =>
                  handlePermissionChange(raw, e.target.value)
                }
                sx={{ mr: 2, width: 120 }}
              >
                <MenuItem value="read">Read</MenuItem>
                <MenuItem value="write">
                  {isFolder ? "Can edit" : "Write"}
                </MenuItem>
              </Select>

              <IconButton onClick={() => handleRemove(raw)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ShareDialog;

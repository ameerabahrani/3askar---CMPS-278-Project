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
  Avatar
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import apiClient from "../services/apiClient";

function ShareDialog({ open, file, onClose }) {
  const [email, setEmail] = React.useState("");
  const [permission, setPermission] = React.useState("read");
  const [collaborators, setCollaborators] = React.useState([]);
  const [copied, setCopied] = React.useState(false);


  const shareLink = `${window.location.origin}/files/${file?.id}/download`;

  // Load collaborators from file
  React.useEffect(() => {
    if (file) {
      setCollaborators(file.sharedWith || []);
    }
  }, [file]);

  const handleCopyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  } catch (err) {
    console.error("Copy failed:", err);
  }
};


  // Reset input on close/open
  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setPermission("read");
    }
  }, [open]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email.trim());

  // 1. Find user by email before sharing
  const handleAddCollaborator = async () => {
    try {
      const res = await apiClient.get(`/user/find?email=${email.trim()}`);

      const user = res.data.user;
      if (!user) {
        alert("This email does not belong to a registered 3askar user.");
        return;
      }

      // Share with backend
      await apiClient.patch(`/files/${file.id}/share`, {
        userId: user._id,
        permission,
      });

      // Update UI
      setCollaborators((prev) => [
        ...prev,
        { user, permission }
      ]);

      setEmail("");
      setPermission("read");

    } catch (err) {
      alert("User not found.");
    }
  };

  // 2. Update collaborator permission
  const handlePermissionChange = async (col, newPerm) => {
    if (!col.user?._id) return;
    await apiClient.patch(`/files/${file.id}/permission`, {
      userId: col.user._id,
      permission: newPerm
    });

    setCollaborators((prev) =>
      prev.map((c) =>
        c.user._id === col.user._id ? { ...c, permission: newPerm } : c
      )
    );
  };

  //  3. Remove collaborator
  const handleRemove = async (col) => {
    if (!col.user?._id) return;
    await apiClient.patch(`/files/${file.id}/unshare`, {
      userId: col.user._id
    });

    setCollaborators((prev) =>
      prev.filter((c) => c.user._id !== col.user._id)
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
        Share “{file?.name}”
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
            <MenuItem value="write">Write</MenuItem>
          </Select>

          <Button
            variant="contained"
            disabled={!isEmailValid}
            onClick={handleAddCollaborator}
          >
            Add
          </Button>
        </Box>

        {/* Collaborator list */}
        <Typography sx={{ mb: 1, fontWeight: 600 }}>
          People with access
        </Typography>

        {collaborators.length === 0 ? (
          <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
            No one else has access
          </Typography>
        ) : (
          collaborators
            .filter((col) => col.user && typeof col.user === 'object' && col.user.email)
            .map((col, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 2,
                p: 1,
                borderRadius: 2,
                "&:hover": { backgroundColor: "#f8f9fa" }
              }}
            >
              <Avatar sx={{ mr: 2 }}>
                {col.user?.email?.charAt(0).toUpperCase() || '?'}
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ fontWeight: 500 }}>
                  {col.user?.email || 'Unknown User'}
                </Typography>
              </Box>

              <Select
                size="small"
                value={col.permission}
                onChange={(e) => handlePermissionChange(col, e.target.value)}
                sx={{ mr: 2, width: 120 }}
              >
                <MenuItem value="read">Read</MenuItem>
                <MenuItem value="write">Write</MenuItem>
              </Select>

              <IconButton onClick={() => handleRemove(col)}>
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

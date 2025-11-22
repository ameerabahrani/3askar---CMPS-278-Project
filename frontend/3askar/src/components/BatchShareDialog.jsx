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
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import apiClient from "../services/apiClient";

function BatchShareDialog({ open, onClose, selectedCount, onShare }) {
  const [email, setEmail] = React.useState("");
  const [permission, setPermission] = React.useState("read");
  const [loading, setLoading] = React.useState(false);

  // Reset input on close/open
  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setPermission("read");
      setLoading(false);
    }
  }, [open]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email.trim());

  const handleShare = async () => {
    if (!isEmailValid) return;
    setLoading(true);
    try {
      // 1. Find user by email
      const res = await apiClient.get(`/user/find?email=${email.trim()}`);
      const user = res.data.user;

      if (!user) {
        alert("This email does not belong to a registered 3askar user.");
        setLoading(false);
        return;
      }

      // 2. Call parent handler to perform batch share
      await onShare(user._id, permission);
      onClose();

    } catch (err) {
      console.error("User find error:", err);
      alert("User not found or error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
        Share {selectedCount} items
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography sx={{ mb: 2, color: "#5f6368" }}>
          Add people to share these items with. They will be added to the existing list of collaborators for each item.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
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
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleShare}
          disabled={!isEmailValid || loading}
        >
          {loading ? "Sharing..." : "Share"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default BatchShareDialog;

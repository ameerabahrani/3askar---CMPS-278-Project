import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function RenameDialog({
  open,
  file,
  title,
  submitLabel,
  placeholder,
  onClose,
  onSubmit,
}) {
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setValue(file?.name || "");
    } else {
      setValue("");
    }
  }, [open, file]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
  };

  const effectiveTitle =
    title || (file ? `Rename “${file.name}”` : "Rename item");
  const effectiveSubmitLabel = submitLabel || "Rename";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
        {effectiveTitle}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            autoFocus
            fullWidth
            size="small"
            label={placeholder || "Name"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!value.trim()}
        >
          {effectiveSubmitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RenameDialog;

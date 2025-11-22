// NewFolderDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  useTheme,
  useMediaQuery,
} from "@mui/material";

function NewFolderDialog({ open, onClose, onSubmit }) {
  const [value, setValue] = React.useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  React.useEffect(() => {
    if (open) setValue(""); // reset when opened
  }, [open]);

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={isMobile}>
      <DialogTitle>New folder</DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Folder name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ mt: 1 }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NewFolderDialog;

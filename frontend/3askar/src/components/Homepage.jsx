import React from "react";
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails} from "@mui/material";
import { Grid, Paper } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";



function Homepage() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const [viewMode, setViewMode] = React.useState("list");

  // File action menu (for list and grid items)
  const [fileMenuAnchor, setFileMenuAnchor] = React.useState(null);
  const [fileMenuIndex, setFileMenuIndex] = React.useState(null);
  const fileMenuOpen = Boolean(fileMenuAnchor);
  const handleFileMenuOpen = (event, index) => {
    event.stopPropagation?.();
    setFileMenuAnchor(event.currentTarget);
    setFileMenuIndex(index);
  };
  const handleFileMenuClose = () => {
    setFileMenuAnchor(null);
    setFileMenuIndex(null);
  };

  const suggestedFiles = [
  {
    name: "Lecture 26 - Stalling, Branch Data Hazards.pdf",
    reason: "You opened • 6 Nov 2025",
    owner: "cmpstudent@aub.edu.lb",
    location: "lectures",
    icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_pdf_x16.png",
  },
  {
    name: "Econ 211 Test Banks.pdf",
    reason: "You opened • 21 Oct 2025",
    owner: "eduforall6@gmail.com",
    location: "More Previous Drive",
    icon: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_pdf_x16.png",
  },
];


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
        Welcome to Drive
      </Typography>

      <Accordion
        defaultExpanded
        disableGutters
        square
        sx={{
          backgroundColor: "transparent",
          boxShadow: "none",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "#5f6368" }} />}
          sx={{
            backgroundColor: "#ffffff",
            borderRadius: "9999px",
            px: 1.5,
            py: 0.5,
            width: "fit-content",
            transition: "all 0.2s ease",
            "& .MuiAccordionSummary-content": {
              marginY: 0,
              marginLeft: 0.5,
            },
            "&:hover": {
              backgroundColor: "#e8f0fe",
              "& .MuiTypography-root": { color: "#1a73e8" },
              "& .MuiSvgIcon-root": { color: "#1a73e8" },
            },
          }}
        >
          <Typography sx={{ fontWeight: 600, color: "#202124" }}>
            Suggested folders
          </Typography>
        </AccordionSummary>

        <AccordionDetails sx={{ backgroundColor: "#ffffff", px: 0 }}>
          <Grid container spacing={2}>
            {[1, 2].map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item}>
                <Paper
                  elevation={0}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    border: "1px solid #e0e0e0",
                    borderRadius: 3,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      transform: "translateY(-2px)",
                    },
                    height: "25%",
                  }}
                >
                  <FolderIcon sx={{ fontSize: 36, color: "#4285f4" }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      Folder {item}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#5f6368" }}>
                      In Shared with me
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={handleClick}>
                    <MoreVertIcon sx={{ color: "#5f6368" }} />
                  </IconButton>
                  <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                    <MenuItem onClick={handleClose}>Open</MenuItem>
                    <MenuItem onClick={handleClose}>Share</MenuItem>
                    <MenuItem onClick={handleClose}>Remove</MenuItem>
                  </Menu>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>

      </Accordion>

      <Accordion
        defaultExpanded
        disableGutters
        square
        sx={{
          backgroundColor: "transparent",
          boxShadow: "none",
          "&:before": { display: "none" },
          mt: 3,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "#5f6368" }} />}
          sx={{
            backgroundColor: "#ffffff",
            borderRadius: "9999px",
            px: 1.5,
            py: 0.5,
            width: "fit-content",
            transition: "all 0.2s ease",
            "& .MuiAccordionSummary-content": {
              marginY: 0,
              marginLeft: 0.5,
            },
            "&:hover": {
              backgroundColor: "#e8f0fe",
              "& .MuiTypography-root": { color: "#1a73e8" },
              "& .MuiSvgIcon-root": { color: "#1a73e8" },
            },
          }}
        >
          <Typography sx={{ fontWeight: 600, color: "#202124" }}>
            Suggested files
          </Typography>
        </AccordionSummary>

        <AccordionDetails sx={{ backgroundColor: "#ffffff", px: 0 }}>
          {/* View mode toggle shown on the right INSIDE details */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <IconButton
              size="small"
              onClick={() => setViewMode("list")}
              sx={{ color: viewMode === "list" ? "#1a73e8" : "#5f6368" }}
              aria-label="List view"
            >
              <ListIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setViewMode("grid")}
              sx={{ color: viewMode === "grid" ? "#1a73e8" : "#5f6368" }}
              aria-label="Grid view"
            >
              <GridViewIcon />
            </IconButton>
          </Box>

          {viewMode === "list" ? (
            <>
              {/* Header row */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 2,
                  py: 1,
                  borderBottom: "1px solid #e0e0e0",
                  color: "#5f6368",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <Box sx={{ flex: 3 }}>Name</Box>
                <Box sx={{ flex: 2 }}>Reason suggested</Box>
                <Box sx={{ flex: 2 }}>Owner</Box>
                <Box sx={{ flex: 2 }}>Location</Box>
                <Box sx={{ width: 40 }}></Box>
              </Box>

              {/* File rows */}
              {suggestedFiles.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid #f1f3f4",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "#f8f9fa",
                    },
                  }}
                >
                  {/* Name + icon */}
                  <Box sx={{ display: "flex", alignItems: "center", flex: 3, gap: 1.5 }}>
                    <img src={file.icon} alt="" width={20} height={20} />
                    <Typography sx={{ fontWeight: 500, color: "#202124" }}>
                      {file.name}
                    </Typography>
                  </Box>

                  {/* Reason */}
                  <Box sx={{ flex: 2 }}>
                    <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                      {file.reason}
                    </Typography>
                  </Box>

                  {/* Owner */}
                  <Box sx={{ flex: 2 }}>
                    <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                      {file.owner}
                    </Typography>
                  </Box>

                  {/* Location */}
                  <Box sx={{ flex: 2 }}>
                    <Typography sx={{ color: "#5f6368", fontSize: 14 }}>
                      {file.location}
                    </Typography>
                  </Box>
                  {/* Actions */}
                  <Box sx={{ display: "flex", alignItems: "center", width: 40, justifyContent: "flex-end" }}>
                    <IconButton size="small" onClick={(e) => handleFileMenuOpen(e, index)} aria-label="More actions">
                      <MoreVertIcon sx={{ color: "#5f6368" }} />
                    </IconButton>
                  </Box>
                </Box>
              ))}

            </>
          ) : (
            /* ---------- GRID VIEW ---------- */
          <Grid container spacing={2} sx={{ px: 2, py: 1 }}>
            {suggestedFiles.map((file, index) => (
              <Grid item xs={12} sm={6} md={3} lg={2} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    position: "relative",
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {/* Actions (top-right) */}
                  <IconButton size="small" sx={{ position: "absolute", top: 4, right: 4 }} onClick={(e) => handleFileMenuOpen(e, index)} aria-label="More actions">
                    <MoreVertIcon sx={{ color: "#5f6368" }} />
                  </IconButton>
                  {/* Thumbnail / icon */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: 120,
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <img src={file.icon} alt="file icon" width={40} height={40} />
                  </Box>

                  {/* Text info */}
                  <Box sx={{ p: 1.5 }}>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: 14,
                        color: "#202124",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#5f6368",
                        fontSize: 12,
                        mt: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.owner}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
          )}

          {/* Shared menu for file actions */}
          <Menu anchorEl={fileMenuAnchor} open={fileMenuOpen} onClose={handleFileMenuClose}>
            <MenuItem onClick={handleFileMenuClose}>Open</MenuItem>
            <MenuItem onClick={handleFileMenuClose}>Share</MenuItem>
            <MenuItem onClick={handleFileMenuClose}>Remove</MenuItem>
          </Menu>
        </AccordionDetails>
      </Accordion>

    </Box>
  );
}

export default Homepage;

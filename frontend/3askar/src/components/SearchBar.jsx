import React, { useState } from "react";
import { Box, InputBase, IconButton, Dialog, DialogTitle, DialogContent, Typography, FormControl, InputLabel, Select, MenuItem, TextField, RadioGroup, Radio, FormControlLabel, Checkbox, Divider, Button } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import { styled, alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";



const SearchContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  borderRadius: 24,
  backgroundColor: alpha(theme.palette.common.black, 0.05),
  padding: theme.spacing(2),
  width: "100%",
  maxWidth: 700,
  height: 48,
}));

export default function SearchBar() {
  const [focused, setFocused] = useState(false);
  const [openAdvanced, setOpenAdvanced] = useState(false);
  const advancedDialogBg = "#e9eef6";

  const [type, setType] = useState("any");
  const [owner, setOwner] = useState("anyone");
  const [includesWords, setIncludesWords] = useState("");
  const [itemName, setItemName] = useState("");
  const [location, setLocation] = useState("anywhere");
  const [starred, setStarred] = useState(false);
  const [inBin, setInBin] = useState(false);

  const [dateModified, setDateModified] = useState("anytime");
  const [afterDate, setAfterDate] = useState("");
  const [beforeDate, setBeforeDate] = useState("");


  //returns all the elements to their default value or empty when reset
  const handleReset = () => {
  setType("any");
  setOwner("anyone");
  setIncludesWords("");
  setItemName("");
  setLocation("anywhere");
  setStarred(false);
  setInBin(false);

  setDateModified("anytime");
  setAfterDate("");
  setBeforeDate("");
};

const handleSearch = () => {
  const filters = {
    type,
    owner,
    includesWords,
    itemName,
    location,
    starred,
    inBin,
    dateModified,
    afterDate,
    beforeDate
  }; // doing this now to ease filtering later on when file system is implemented

  console.log("Advanced search filters:", filters); 

  // close the dialog
  setOpenAdvanced(false);
};

const searchBarRef = React.useRef(null);

const [anchorPos, setAnchorPos] = useState({ top: 0, left: 0, width: 0 });

React.useEffect(() => {
  if (searchBarRef.current) {
    const rect = searchBarRef.current.getBoundingClientRect();
    setAnchorPos({
      top: rect.bottom + 8,   // 8px gap under search bar
      left: rect.left,
      width: rect.width
    });
  }
}, [openAdvanced, focused, window.innerWidth]);

const updateAnchorPosition = () => {
  if (searchBarRef.current) {
    const rect = searchBarRef.current.getBoundingClientRect();
    setAnchorPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width
    });
  }
};

React.useEffect(() => {
  if (openAdvanced) {
    updateAnchorPosition();
  }
}, [openAdvanced]);

React.useEffect(() => {
  const handleResize = () => {
    updateAnchorPosition();
  };

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);



  return (
    <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center"}}>
      <SearchContainer
        ref={searchBarRef}
        sx={{
          height: "20px",
          backgroundColor: focused ? "#ffffff" : "#e9eef6",
          transition: "background-color 0.2s ease, box-shadow 0.2s ease",
          boxShadow: focused ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
          maxWidth: { xs: 280, sm: 500, md: 700 },
          "&:hover": { backgroundColor: focused ? "#ffffff" : "#dfe3eb" },
        }}
      >
        <IconButton sx={{ mr: 1, color: "#5f6368", "&:hover": { color: "#202124" } }}>
            <SearchIcon />
        </IconButton>
        <InputBase
          placeholder="Search in Drive"
          sx={{
            flex: 1,
            color: "#000000",
            fontSize: 15,
            ml: 1,
            fontWeight: 700,
            "& .MuiInputBase-input::placeholder": {
              fontWeight: 700,
              color: "#000000",
            },
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        <IconButton sx={{ ml: 1, color: "#5f6368", "&:hover": { color: "#202124" } }}
        onClick={() => setOpenAdvanced(true)}
        >
            <TuneIcon />
        </IconButton>
      </SearchContainer>

      <Dialog
      open={openAdvanced}
      onClose={() => setOpenAdvanced(false)}
      maxWidth ='sm'
      fullWidth
      PaperProps={{
      sx: {
        backgroundColor: advancedDialogBg,
        borderRadius: "12px",
        position: "absolute",
        top: `${anchorPos.top}px`,
        left: `${anchorPos.left}px`,
        width: `${anchorPos.width}px`,
        m: 0,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        maxHeight: "80vh",
        overflowY: "auto",
      }
    }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pr: 1.5,
          }}
        >
          Advanced Search

          <IconButton
            onClick={() => setOpenAdvanced(false)}
            sx={{
              color: "#5f6368",
              "&:hover": { color: "#202124", backgroundColor: "transparent" },
              p: 0.5,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>

          {/* TYPE */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3}}>
            <Box sx={{ width: 140, fontSize: 15, color: "#444746", fontWeight: "bold" }}>
              Type
            </Box>

            <Select
              size="small"
              defaultValue="any"
              value={type}
              onChange={(e) => setType(e.target.value)}
              sx={{
                flex: 1,
                backgroundColor: advancedDialogBg,
                "& fieldset": { borderColor: "#747775" },
                "&:hover fieldset": { borderColor: "#5f6368" },
                "&.Mui-focused fieldset": { borderColor: "#1a73e8" },
              }}
            >
              <MenuItem value="any">Any</MenuItem>
              <MenuItem value="pdf">PDFs</MenuItem>
              <MenuItem value="docs">Documents</MenuItem>
              <MenuItem value="images">Images</MenuItem>
              <MenuItem value="videos">Videos</MenuItem>
              <MenuItem value="folders">Folders</MenuItem>
            </Select>
          </Box>

          {/* Onwerr */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3}}>
            <Box sx={{ width: 140, fontSize: 15, color: "#444746", fontWeight: "bold" }}>
              Owner
            </Box>

            <Select
              size="small"
              defaultValue="anyone"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              sx={{
                flex: 1,
                backgroundColor: advancedDialogBg,
                "& fieldset": { borderColor: "#747775" },
                "&:hover fieldset": { borderColor: "#5f6368" },
                "&.Mui-focused fieldset": { borderColor: "#1a73e8" },
              }}
            >
              <MenuItem value="anyone">Anyone</MenuItem>
              <MenuItem value="me">Owned by me</MenuItem>
              <MenuItem value="notMe">Not owned by me</MenuItem>
              <MenuItem value="person">Specific person</MenuItem>
            </Select>
          </Box>

          {/* inclues the word */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3}}>
            <Box sx={{ width: 140, fontSize: 15, color: "#444746", fontWeight: "bold" }}>
              Includes the words
            </Box>

            <TextField
            placeholder="Enter words found in the file"
            size="small"
            fullWidth
            value={includesWords}
            onChange={(e) => setIncludesWords(e.target.value)}
            sx={{
              backgroundColor: advancedDialogBg,
              "& .MuiOutlinedInput-root": {
                borderRadius: "3px",
                "& fieldset": {
                  borderColor: "#747775",
                },
                "&:hover fieldset": {
                  borderColor: "#5f6368",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#1a73e8",
                },
              },
              "& .MuiInputBase-input::placeholder": {
                fontSize: "14px",
                color: "#5f6368",
                opacity: 1,
              },
              ml: 5
              }}
              
            />

          </Box>


          {/* Item name */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3}}>
            <Box sx={{ width: 140, fontSize: 15, color: "#444746", fontWeight: "bold" }}>
              Item name
            </Box>

            <TextField
            placeholder="Enter a term that matches part of the file name"
              size="small"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              sx={{
                backgroundColor: advancedDialogBg,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "3px",
                  "& fieldset": {
                    borderColor: "#747775",
                  },
                  "&:hover fieldset": {
                    borderColor: "#5f6368",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#1a73e8",
                  },
                },
                "& .MuiInputBase-input::placeholder": {
                  fontSize: "14px",
                  color: "#5f6368",
                  opacity: 1,
                },
                ml: 5
              }}
              
            />
          </Box>

          {/* location */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{ width: 140, fontSize: 15, color: "#444746", fontWeight: "bold", mt: 1 }}>
              Location
            </Box>

            <RadioGroup defaultValue="anywhere" sx={{ display: "flex", flexDirection: "row", gap: 0.5 }}
            value={location} onChange={(e) => setLocation(e.target.value)}>
              <FormControlLabel
                value="anywhere"
                control={<Radio size="small" />}
                label="Anywhere"
                sx={{ color: "#202124" }}
              />
              <FormControlLabel
                value="mydrive"
                control={<Radio size="small" />}
                label="My Drive"
                sx={{ color: "#202124" }}
              />
              <FormControlLabel
                value="shared"
                control={<Radio size="small" />}
                label="Shared with me"
                sx={{ color: "#202124" }}
              />
            </RadioGroup>
          </Box>
          {/* CHECKBOXES: Starred, In Bin, Encrypted */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>

            <Box sx={{ display: "flex", flexDirection: "row", gap: 0.5, ml: 19.5 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    size="small" 
                    checked={starred}
                    onChange={(e) => setStarred(e.target.checked)}
                  />
                }
                label="Starred"
              />

              <FormControlLabel
                control={
                  <Checkbox 
                    size="small" 
                    checked={inBin}
                    onChange={(e) => setInBin(e.target.checked)}
                  />
                }
                label="In Bin"
              />
            </Box>
          </Box>

          {/* Date Modifed */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3}}>
            <Box sx={{ width: 140, fontSize: 15, color: "#444746", fontWeight: "bold" }}>
              Date modified
            </Box>

            <Select
              size="small"
              defaultValue="anytime"
              value={dateModified}
              onChange={(e) => {
                const value = e.target.value;
                setDateModified(value);
                if (value !== "custom") {
                  setAfterDate("");
                  setBeforeDate("");
                }
              }}
              sx={{
                flex: 1,
                backgroundColor: advancedDialogBg,
                "& fieldset": { borderColor: "#747775" },
                "&:hover fieldset": { borderColor: "#5f6368" },
                "&.Mui-focused fieldset": { borderColor: "#1a73e8" },
              }}
            >
              <MenuItem value="anytime">Any time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="last7Days">Last 7 days</MenuItem>
              <MenuItem value="last30Days">Last 30 days</MenuItem>
              <MenuItem value="last90Days">Last 90 days</MenuItem>
              <MenuItem value="custom">Custom...</MenuItem>

            </Select>

          </Box>

           {/* Show custom date range fields only when dateModified === 'custom' */}
            {dateModified === "custom" && (
              <Box sx={{ ml: "140px", mt: 1 }}>
                <Box sx={{ fontSize: 14, color: "#3c4043", mb: 1 }}>
                  Between:
                </Box>

                <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                  <TextField
                    label="After date"
                    type="date"
                    size="small"
                    fullWidth
                    value={afterDate}
                    onChange={(e) => setAfterDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: beforeDate || undefined }}
                    sx={{
                      backgroundColor: advancedDialogBg,
                      "& input::-webkit-calendar-picker-indicator": {
                        opacity: 1,
                        cursor: "pointer",
                        filter: "invert(40%)",
                      },
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        "& fieldset": { borderColor: "#747775" },
                        "&:hover fieldset": { borderColor: "#5f6368" },
                        "&.Mui-focused fieldset": { borderColor: "#1a73e8" },
                      },
                    }}
                  />

                  <TextField
                    label="Before date"
                    type="date"
                    size="small"
                    fullWidth
                    value={beforeDate}
                    onChange={(e) => setBeforeDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: afterDate || undefined }}
                    sx={{
                      backgroundColor: advancedDialogBg,
                      "& input::-webkit-calendar-picker-indicator": {
                        opacity: 1,
                        cursor: "pointer",
                        filter: "invert(40%)",
                      },
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        "& fieldset": { borderColor: "#747775" },
                        "&:hover fieldset": { borderColor: "#5f6368" },
                        "&.Mui-focused fieldset": { borderColor: "#1a73e8" },
                      },
                    }}
                  />
                </Box>
              </Box>
            )}

        </DialogContent>

        <Divider sx={{mb: 2}} />
        <Box sx={{ display: "flex", justifyContent: "right", alignItems: "center", pb: 2, pr: 2}}>



          {/* Right side: Reset + Search */}
          <Box sx={{ display: "flex", gap: 2 }}>
            
            <Button
            variant="outlined"
            onClick={handleReset}
            sx={{
              textTransform: "none",
              borderRadius: "30px",
              px: 3,
              borderColor: "#1a73e8",
              color: "#1a73e8",
              "&:hover": {
                borderColor: "#1558b0",
                backgroundColor: "rgba(26,115,232,0.04)",
              },
            }}
            >
              Reset
            </Button>

            <Button
            variant="contained"
            onClick={handleSearch}
            sx={{
              textTransform: "none",
              borderRadius: "30px",
              px: 3,
              backgroundColor: "#1a73e8",
              "&:hover": {
                backgroundColor: "#1558b0",
              },
            }}
            >
              Search
            </Button>

          </Box>

        </Box>




      </Dialog>
    </Box>
  );
}
